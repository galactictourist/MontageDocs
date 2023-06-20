const { expect } = require("chai");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)
const printGasFee = (fnName, rc) => {
	const gasFee = rc.gasUsed * rc.effectiveGasPrice
	console.log(fnName + " gas fee:", ethers.utils.formatEther(gasFee), "ETH");
};
const baseContractPath = "./src/backend/contracts/oneArtist/existing/";
const montageAddress = "0xE4068ba8805e307f0bC129ddE8c0E25A46AE583f";

describe("Buffer", function () {
	let NFTfactory;
	let nftFactory;
	let NFTcontract;
	let nftContract;
	let GroupFactory;
	let groupFactory;
	let Buffer;
	let buffer;
	let signers;
	let deployer;
	let addrs;

	runTxAndPrintGasFee = async (txPromise, fnName) => {
		const tx = await txPromise;
		const rc = await tx.wait();
		printGasFee(fnName, rc);
	}

	beforeEach(async function () {
		console.log("****TESTING NOW*******");
		console.log("baseContractPath:", baseContractPath);

		signers = await ethers.getSigners();
		[deployer, ...addrs] = signers;

		GroupFactory = await ethers.getContractFactory(baseContractPath + "splitter/GroupFactory.sol:Factory");
		groupFactory = await GroupFactory.deploy();
		printGasFee("GroupFactory.deploy", await groupFactory.deployTransaction.wait());

		Buffer = await ethers.getContractFactory(baseContractPath + "splitter/Buffer.sol:Buffer");
		buffer = await Buffer.deploy();
		printGasFee("Buffer.deploy", await buffer.deployTransaction.wait());


		NFTfactory = await ethers.getContractFactory(baseContractPath + "nft/NFTfactory.sol:Factory");
		nftFactory = await NFTfactory.deploy();
		printGasFee("NFTfactory.deploy", await nftFactory.deployTransaction.wait());

		NFTcontract = await ethers.getContractFactory(baseContractPath + "nft/NFTcontract.sol:NFTcontract");
		nftContract = await NFTcontract.deploy();
		printGasFee("NFTcontract.deploy", await nftContract.deployTransaction.wait());
	});

	describe("Genesis/Receive/Withdraw", function () {
		it("Should receive payments, then withdraw and donate all shares, and finaly buffer's balance should be 0", async function () {
			const coreTeam = addrs.slice(0, 10);
			const buyers = addrs.slice(15, 20);
			const donateTo = buyers[3];

			const initNFTContract = async () => {
				const tx = await nftFactory.genesis(buffer.address, deployer.address, "NFT", "NFT", 1000);
				const rc = await tx.wait();
				printGasFee("nftFactory.genesis", rc);
				const event = rc.events.find(event => event.event === 'ContractDeployed');
				const [, clone] = event.args;
				nftContract = await nftContract.attach(clone);
			}
			const initCoreTeamAndArtists = async () => {
				const tx = await groupFactory.genesis("Royalties Distributor",
					[1000, 5000, 4000],
					coreTeam.map(a => a.address),
					[9100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
					nftContract.address
				);
				const rc = await tx.wait();
				printGasFee("groupFactory.genesis", rc);
				const event = rc.events.find(event => event.event === 'ContractDeployed');
				const [, group] = event.args;
				buffer = await buffer.attach(group);
				await nftContract.connect(deployer).setCollectAddress(buffer.address);
			}
			const mintsAndSales = async () => {
				await nftContract.connect(deployer).setStage(1);
				await runTxAndPrintGasFee(nftContract.connect(buyers[0]).mintWithQTY(1, { value: toWei(0.01) }), "receive mint payment");
				await runTxAndPrintGasFee(nftContract.connect(buyers[1]).mintWithQTY(3, { value: toWei(0.03) }), "receive multi mint payment");
				await buyers[2].sendTransaction({ to: buffer.address, value: toWei(0.05) });
			}
			const printOtherBalances = async () => {
				console.log("Buffer balance:", fromWei(await ethers.provider.getBalance(buffer.address)));
			}
			const printPendingPayouts = async (msg) => {
				console.log(msg);
				const montageEarnings = fromWei(await buffer.viewEarnings(montageAddress));
				if (parseFloat(montageEarnings) > 0) {
					console.log(`viewEarnings(montageAddress)`, montageEarnings);
				}
				await printOtherBalances();
				await Promise.all(coreTeam.map(async (teamMember, i) => {
					const earnings = fromWei(await buffer.viewEarnings(teamMember.address));
					if (parseFloat(earnings) > 0) {
						console.log(`viewEarnings(coreTeam[${i}])`, earnings);
					}
				}));
				// await Promise.all(buyers.map(async (buyer, i) => {
				// 	const donationAmt = fromWei(await buffer.viewDonationAmt(buyer.address));
				// 	if (parseFloat(donationAmt) > 0) {
				// 		console.log(`viewDonationAmt(buyers[${i}])`, donationAmt);
				// 	}
				// }));
			}
			const withdrawAndDonate = async () => {
				console.log("Withdraw and donate all shares");
				await Promise.all(coreTeam.map(async (teamMember, i) => {
					const amt = parseFloat(fromWei(await buffer.viewEarnings(teamMember.address)));
					if (amt > 0) {
						await runTxAndPrintGasFee(buffer.connect(teamMember).withdraw(), `withdraw(coreTeam[${i}])`);
					}
				}));
				// await Promise.all(buyers.map(async (buyer, i) => {
				// 	const amt = parseFloat(fromWei(await buffer.viewDonationAmt(buyer.address)));
				// 	if (amt > 0) {
				// 		await runTxAndPrintGasFee(buffer.connect(buyer).holderDonate(donateTo.address), `holderDonate(buyer[${i}])`);
				// 	}
				// }));
			}

			await initNFTContract();
			await initCoreTeamAndArtists();
			// await printEarningsAndDonationAmt("Initial Earnings and Donation Amt");
			await mintsAndSales();
			const montageTotalWithdrawn = fromWei(await buffer.viewTotalWithdrawn(montageAddress));
			if (parseFloat(montageTotalWithdrawn) > 0) {
				console.log(`totalWithdrawn(montageAddress)`, montageTotalWithdrawn);
			}
			await printPendingPayouts("Earnings and Donation Amt after 4 mints and 1 sale");
			await withdrawAndDonate();
			await printPendingPayouts("Earnings and Donation Amt after withdraw and donate");

			await Promise.all(signers.map(async ({ address }, i) => {
				const totalWithdrawn = fromWei(await buffer.viewTotalWithdrawn(address));
				if (parseFloat(totalWithdrawn) > 0) {
					console.log(`totalWithdrawn(address[${i}])`, totalWithdrawn);
				}
				const totalDonated = fromWei(await buffer.viewTotalDonated(address));
				if (parseFloat(totalDonated) > 0) {
					console.log(`totalDonated(address[${i}])`, totalDonated);
				}
			}));

			expect(await ethers.provider.getBalance(buffer.address), "Buffer balance").to.equal("0");
		});
	});
});