async function main() {
	const contractAddress = "0xCafac3dD18aC6c6e92c921884f9E4176737C052c";
	const c = await hre.ethers.getContractAt("NFTcontract.sol", contractAddress);

	const mintToken = await c.mintWithQ(1, { value: ethers.utils.parseEther("0.3") });

	console.log("Trx hash:", mintToken.hash);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
