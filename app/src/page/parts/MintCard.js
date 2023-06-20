import { lazy, Suspense, useContext, useEffect, useState } from 'react';
import Spinner from '../../util/Spinner';
import './mint-card.scss';
import { AppControl } from "./AppControl";
import { etherScanAddress } from "./activityTables/helper/EtherScanLink";
import { SaveButton } from "./SaveButton";
import { getMintPriceETH, loadArtistAddresses } from "../../func/liveCollections";
import AuthContext from "../../ctx/Auth";
import FontIcon from "../../fontIcon/FontIcon";
import { getNFTContract } from "../../frontend/contractsData/addresses";
import { getTimerRenderer } from './timerRenderer';
import { useNavigate } from 'react-router';
import { ContractTypes } from '../../util/contractTypes';
import { updateMintedStatus } from '../../func/items';
import { getMintStage } from '../../util/getMintStage';
import { getMaxMintPerWallet } from '../../util/getMaxMintPerWallet';
const Countdown = lazy(() => import('react-countdown'))

export function MintCard({ collectionId, targetDate = null, targetDateTitle = "Presale ends in:", canGrow, nftAddress, stage, demoStage, selfMinted, onMint, onMintFailed, enforceAllowList = true, maxItemsPerMinter = 0, isInAllowList, contractType }) {
	const { accounts: accountAddress, userId } = useContext(AuthContext)
	const [totalSupply, setTotalSupply] = useState(0)
	const [maxPublicMint, setMaxPublicMint] = useState(0)
	const [mintQty, setMintQty] = useState(1)
	const [minting, setMinting] = useState(false)
	const [totalPrice, setTotalPrice] = useState(0)
	const [nftContract, setNFTContract] = useState(null)

	const setTotalSupplyAndMaxPublicMint = async (nftContract) => {
		setTotalSupply(parseInt(await nftContract.methods.totalSupply().call()))
		if (!canGrow) {
			setMaxPublicMint(parseInt(await nftContract.methods.maxSupply().call()))
		}
	}
	const navigate = useNavigate()
	useEffect(() => {
		if (nftAddress) {
			(async () => {
				const nftContract = await getNFTContract(nftAddress, contractType)
				setNFTContract(nftContract)
				setTotalSupplyAndMaxPublicMint(nftContract)
			})()
		} else {
			setTotalSupply(333)
			setMaxPublicMint(1000)
		}
		// eslint-disable-next-line
	}, [nftAddress])
	useEffect(() => {
		if (collectionId) {
			if (!selfMinted && mintQty > 0) getMintPriceETH(collectionId, stage, mintQty).then(setTotalPrice)
			else setTotalPrice(0)
		}
	}, [mintQty, collectionId, stage, selfMinted])
	const soldout = !canGrow && totalSupply >= maxPublicMint
	const maxMintQty = maxPublicMint - totalSupply

	const tokensMintedEvent = async (nftContract) => {
		console.log('Waiting for TokensMinted event...')
		return new Promise((resolve, reject) => {
			nftContract.once('TokensMinted', (error, data) => {
				if (error) {
					console.error(error)
					setMinting(false)
					onMintFailed()
					reject(error)
				} else {
					console.log('TokensMinted event received', data)
					resolve(data)
				}
			})
		})
	}

	const mintNow = async (nftContract, qty, amount) => {
		if (!nftContract) return
		if (qty > 0) {
			if (!accountAddress)
				throw new Error(`Please connect your wallet to mint`)

			// Enforce allow list
			if (enforceAllowList) {
				if (!isInAllowList) {
					throw new Error(`You are not on the allow list`)
				}
			}

			const currentStage = await getMintStage(nftContract)
			if (currentStage === 0) {
				throw new Error('Minting is not currently active.')
			}

			const maxMintPerWallet = await getMaxMintPerWallet(nftContract)
			if (maxMintPerWallet > 0) {
				const tokensInWallet = parseInt(await nftContract.methods.balanceOf(accountAddress).call())
				console.log('Minted before', tokensInWallet)
				if (tokensInWallet + qty > maxMintPerWallet) {
					throw new Error(`You can mint up to ${maxMintPerWallet} NFTs in this collection`)
				}
			}

			const totalSupply = parseInt(await nftContract.methods.totalSupply().call()) + 1

			try {
				setMinting(true)
				const { BigNumber } = await import('ethers')
				const getEthAmount = (amount) => BigNumber.from(Math.round(parseFloat(amount) * 1e18).toString())

				const artistAddresses = contractType & ContractTypes.manyArtists ? await loadArtistAddresses(collectionId, qty) : null
				if (contractType & ContractTypes.manyArtists) {
					if (artistAddresses?.length !== qty) {
						throw new Error('Artist addresses are not ready yet')
					}
					const findIndexOfNextArtist = (artist, artistIx) => {
						return artistAddresses.findIndex((a, i) => i > artistIx && a.toLowerCase() !== artist.toLowerCase())
					}
					let artistIx = 0
					while (artistIx > -1) {
						const artist = artistAddresses[artistIx]
						const nextArtistIx = findIndexOfNextArtist(artist, artistIx)
						const artistQty = (nextArtistIx > -1 ? nextArtistIx : qty) - artistIx
						const artistAmt = amount * artistQty / qty
						console.log('Minting', artistQty, 'tokens of artist', artist)
						await Promise.all([
							tokensMintedEvent(nftContract),
							nftContract.methods.mintWithQTY(artistQty, artist).send({ from: accountAddress, value: getEthAmount(artistAmt) })
						])
						artistIx = nextArtistIx
					}
				} else {
					console.log('Minting', qty, 'tokens')
					await Promise.all([
						tokensMintedEvent(nftContract),
						nftContract.methods.mintWithQTY(qty).send({ from: accountAddress, value: getEthAmount(amount) })
					])
				}
				await updateMintedStatus(collectionId, totalSupply, qty, userId)
				await setTotalSupplyAndMaxPublicMint(nftContract)
				setMinting(false)
				if (onMint) {
					onMint({ success: true, nftAddress, firstTokenId: totalSupply, qty })
				}
			} catch (e) {
				console.error(e)
				setMinting(false)
				onMintFailed()
			}
		}
	}

	return (
		<div className="py-4">
			<div className="card card-360 mint-card">
				{targetDate ? <div>
					<div className="timer-label">{targetDateTitle}</div>
					<Suspense fallback={<Spinner />}>
						<Countdown date={targetDate} renderer={getTimerRenderer(() => navigate(`/collection-page/${collectionId}`))} />
					</Suspense>
				</div> : null}

				{maxPublicMint > 0 ?
					<div className="mint-progress">
						<div className={"total-minted-ct" + (soldout ? " soldout" : "")}>
							<span className="total-minted-counter">{totalSupply}/{canGrow ? "∞" : maxPublicMint}</span>
							<span className="total-minted-phrase">{soldout ? "total minted" : totalSupply > 0 ? "already minted" : ""}</span>
						</div>
						<progress className="ok-green-style" value={totalSupply} max={maxPublicMint}></progress>
					</div>
					: null}

				<div className="flex-row ai-c jc-sb">
					<span>Amount{canGrow ? '' : ` ${maxMintQty} (max)`}</span>
					<AppControl type="number" noLabel={true} disabled={soldout} readOnly={soldout} borderedNumberBox={true} min={1} max={canGrow ? undefined : maxMintQty} value={mintQty} setValue={setMintQty} />
				</div>

				<div className="total-line">
					<span>Total:</span>
					<span className="total-line--price">{Math.round(1e4 * totalPrice) / 1e4}<FontIcon name="eth" inline={true} /></span>
				</div>

				<SaveButton text={soldout ? "Soldout" : "Mint now"} onClick={async () => await mintNow(nftContract, parseInt(mintQty), totalPrice)} disabled={soldout || minting || demoStage} saving={minting} />

				<div className="ta-c">
					<a href={etherScanAddress(nftAddress || process.env.REACT_APP_NFT_FACTORY_ADDR)} target="_blank" rel="noreferrer" className="primary">Smart contract</a>
				</div>
			</div>
		</div>
	)
}
