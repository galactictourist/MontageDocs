const hre = require("hardhat")
const fs = require("fs");
const x = require("@nomiclabs/hardhat-etherscan"); // for hre.run("verify:verify"...);
const { network } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const marketplace = async () => await deployAndVerify("marketplace/NFTMarketplace.sol:NFTMarketplace");
  const nftFactory = async () => await deployAndVerify("nft/NFTfactory.sol:Factory");
  const nftContract = async () => await deployAndVerify("nft/NFTcontract.sol:NFTcontract", [deployer.address, deployer.address, "NFT", "NFT", 100, 1000]);
  const groupFactory = async () => await deployAndVerify("splitter/GroupFactory.sol:Factory");
  const splitter = async () => await deployAndVerify("splitter/Buffer.sol:Buffer");

  await marketplace();
  await nftFactory();
  await nftContract();
  await groupFactory();
  await splitter();
}

async function deployAndVerify(relPath, constructorArguments = []) {
  const basePath = "src/backend/contracts";
  const contractFullName = basePath + "/" + relPath;
  const factory = await ethers.getContractFactory(contractFullName);
  const contract = await factory.deploy(...constructorArguments);
  const subDir = relPath.split('/')[0];
  const name = relPath.split(':')[1];
  saveFrontendFiles(contract, name, subDir, contractFullName);
  await verifyContract(contract, name, contractFullName, constructorArguments);
}

async function verifyContract(contract, name, contractFullName, constructorArguments) {
  console.log(`Waiting for ${name} contract to be deployed onto ${network.name}...`);
  contract = await contract.deployed();
  console.log(`Deployed ${name} contract with ${contract.address} address onto ${network.name}`);
  if (network.name !== "localhost") {
    const { address, deployTransaction } = contract;
    try {
      await runVerify(address);
    } catch (e) {
      const err = e.toString()?.toLowerCase();
      if (err?.includes("try to wait for five confirmations")) {
        console.log(err);
        console.log("Waiting for 5 confirmations before proceeding to verify task...");
        const receipt = await waitForConfirmations(deployTransaction.hash);
        if (receipt.status === 1) {
          await runVerify(address);
        } else {
          console.log(`Transaction failed: ${receipt}`);
        }
      } else {
        throw e;
      }
    }
  } else {
    console.log(`Skipping ${name} contract verification on localhost`);
  }

  async function runVerify(address) {
    console.log(`Verifying ${name} contract with the address: ${address}`);
    try {
      await hre.run("verify:verify", { address, contract: contractFullName, constructorArguments });
    } catch (e) {
      const err = e.toString()?.toLowerCase();
      if (err?.includes("already verified")) {
        console.log(`${name} contract already verified`);
      } else {
        throw e;
      }
    }
  }

}

async function waitForConfirmations(transactionHash, confirmationThreshold = 5) {
  const provider = ethers.provider;
  let currentConfirmation = 0;
  let receipt;
  while (currentConfirmation < confirmationThreshold) {
    receipt = await provider.getTransactionReceipt(transactionHash);
    if (receipt && receipt.blockNumber) {
      currentConfirmation = (await provider.getBlockNumber()) - receipt.blockNumber + 1;
    }
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
  }
  return receipt;
}

function saveFrontendFiles(contract, name, subDir, fullName) {
  const contractsDir = __dirname + "/../../frontend/contractsData/" + network.name + (subDir ? "/" + subDir : "");
  if (!fs.existsSync(contractsDir)) {
    throw new Error(`Contracts directory ${contractsDir} does not exist!`);
  }
  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
  const contractArtifact = artifacts.readArtifactSync(fullName);
  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });