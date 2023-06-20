import { SingleMarketPlaceContract, getContractPath } from '../../util/contractTypes'

const CHAINID = process.env.REACT_APP_CHAINID
export const useMainnet = CHAINID === "0x1"
export const useTestnet = CHAINID === "0xaa36a7" // 11155111
export const useLocalhost = CHAINID === "0x7a69" // 31337
const network = useMainnet ? "mainnet" : useTestnet ? "sepolia" : useLocalhost ? "localhost" : "unknown"

const getAddr = async (contractType, relPath) => (await import(`./${network}/${getContractPath(contractType)}${relPath}`)).address
const getABI = async (contractType, relPath) => (await import(`./${network}/${getContractPath(contractType)}${relPath}`)).abi

const NFT_FACTORY_ADDR = async (contractType) => await getAddr(contractType, 'nft/Factory-address.json')
const GROUP_FACTORY_ADDR = async (contractType) => await getAddr(contractType, 'splitter/Factory-address.json')
export const MARKET_ADDR = async () => await getAddr(SingleMarketPlaceContract, 'marketplace/NFTMarketplace-address.json')

export const getMarketContract = async () => await getContract(
	SingleMarketPlaceContract,
	'marketplace/NFTMarketplace.json',
	await MARKET_ADDR(SingleMarketPlaceContract)
)

export const getNFTContract = async (addr, contractType) => await getContract(contractType, 'nft/NFTcontract.json', addr)
export const getNFTContractFactory = async (contractType) => await getContract(contractType, 'nft/Factory.json', await NFT_FACTORY_ADDR(contractType))

export const getBufferContract = async (addr, contractType) => await getContract(contractType, 'splitter/Buffer.json', addr)
export const getBufferContractFactory = async (contractType) => await getContract(contractType, 'splitter/Factory.json', await GROUP_FACTORY_ADDR(contractType))

const getContract = async (contractType, abiRelPath, addr) => {
	const web3 = await getWeb3()
	const abi = await getABI(contractType, abiRelPath)
	const contract = new web3.eth.Contract(abi, addr)
	return contract
}

const getWeb3 = async () => {
	const Web3 = await import('web3')
	const web3 = new Web3.default(window.ethereum)
	return web3
}