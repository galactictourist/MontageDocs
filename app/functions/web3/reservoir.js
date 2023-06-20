const { BigNumber, ethers } = require('ethers');

const sdk = require('api')('@reservoirprotocol/v3.0#2l6fslh5fu4vc');
sdk.auth(process.env.RESERVOIR_API_KEY);

//Calls the resevoir api to return all sales
/**
 * 
 * @param {nft contract address} nftAddress 
 * @param {array of tokens ids to search} tokenIDs 
 * @returns 
 */

async function getSalesRaw(contract, tokenIDs) {
	let args = tokenIDs.length > 0 ? ({ tokens: tokenIDs.map((item) => `${contract}%3A${item}`) }) : ({ contract })
	let results = await sdk.getSalesV5({ ...args, accept: '*/*' })
	return results.sales
}
// Utility function to calculate total sales and fess for a token
function getSaleValueTotal(sales) {
	let totalSalesFromMints = BigNumber.from(0);
	let totalSecondarySales = BigNumber.from(0);
	let royalties = BigNumber.from(0);
	sales?.forEach(sale => {
		const raw = BigNumber.from(sale.price.amount.raw)
		if (sale.orderKind === 'mint') {
			totalSalesFromMints = totalSalesFromMints.add(raw);
		} else {
			totalSecondarySales = totalSecondarySales.add(raw);
		}
		if (sale.marketplaceFeeBps > 0) {
			royalties = royalties.add(raw.mul(sale.marketplaceFeeBps / 10000));
		};
	})
	return {
		totalSalesFromMints: ethers.utils.formatEther(totalSalesFromMints),
		totalSecondarySales: ethers.utils.formatEther(totalSecondarySales),
		royalties: ethers.utils.formatEther(royalties)
	}
}
/** Fetch results and calculate
 * 
 * @param {nft contract address} nftAddress 
 * @param {array of tokens ids to search} tokenIDs 
 * @returns 
 */
async function getCollectionSalesTotals(nftAddress, tokenIDs) {
	if (tokenIDs?.length > 0) {
		// chunkify the tokenIDs array into groups of 20
		let chunked = [];
		let i = 0;
		let n = tokenIDs?.length || 0;
		while (i < n) {
			chunked.push(tokenIDs.slice(i, i += 20));
		}
		// get the sales for each chunk
		const dataChunks = await Promise.all(chunked.map(async (chunk) => await getSalesRaw(nftAddress, chunk)))
		// flatten the results
		const allSales = dataChunks.flat()
		// calculate the total sales and fees
		return getSaleValueTotal(allSales)
	} else {
		const sales = await getSalesRaw(nftAddress)
		return getSaleValueTotal(sales)
	}
}

exports.getCollectionSalesTotals = getCollectionSalesTotals;

// Examples
// let test = {
//   "sales": [
//     {
//       "id": "92c8864bf384e39773648bd4006887333bba8d9c74896571479c30ec5146686b",
//       "saleId": "d97c21c8a4b36c6ee05e0800927c4566a86a64fc2fa3c49b8afb96e457d18def",
//       "token": {
//         "contract": "0x4ae57798aef4af99ed03818f83d2d8aca89952c7",
//         "tokenId": "705",
//         "name": null,
//         "image": null,
//         "collection": {
//           "id": null,
//           "name": null
//         }
//       },
//       "orderId": "0xe6b170f5e7aa1e0c3e14db98e516d880757ac4c470562c5539bade9a13642c30",
//       "orderSource": "opensea.io",
//       "orderSide": "ask",
//       "orderKind": "wyvern-v2",
//       "from": "0x82397c3222c3797aa8c01eb05c316070281cd779",
//       "to": "0xc78a95019c52ad9856aa764d6908e88d5b7930ee",
//       "amount": "1",
//       "fillSource": "opensea.io",
//       "block": 12065699,
//       "txHash": "0xddb1b0925fb92502dd24d885f84afe9e7226f5d3d280bcff41b23667be4f1f69",
//       "logIndex": 69,
//       "batchIndex": 1,
//       "timestamp": 1616110791,
//       "price": {
//         "currency": {
//           "contract": "0x0000000000000000000000000000000000000000",
//           "name": "Ether",
//           "symbol": "ETH",
//           "decimals": 18
//         },
//         "amount": {
//           "raw": "410000000000000000",
//           "decimal": 0.41,
//           "usd": 729.86545,
//           "native": 0.41
//         },
//         "netAmount": {
//           "raw": "379250000000000000",
//           "decimal": 0.37925,
//           "usd": 675.12554,
//           "native": 0.37925
//         }
//       },
//       "washTradingScore": 0,
//       "marketplaceFeeBps": 750,
//       "paidFullRoyalty": true,
//       "feeBreakdown": [
//         {
//           "kind": "marketplace",
//           "bps": 750,
//           "recipient": "0x5b3256965e7c3cf26e11fcaf296dfc8807c01073"
//         }
//       ],
//       "isDeleted": false,
//       "createdAt": "2021-03-18T23:39:51.000Z",
//       "updatedAt": "2023-04-03T10:15:14.291Z"
//     },
//     {
//       "id": "910428561b861c3c42423097fcdc20361c0d89bf00e5dddc52b70f110d81cd39",
//       "saleId": "5c4cc152e24c5f0f606a73f7ebe71ae69ade3af1b26e0542d8a09d1fa14a157d",
//       "token": {
//         "contract": "0x4ae57798aef4af99ed03818f83d2d8aca89952c7",
//         "tokenId": "704",
//         "name": null,
//         "image": null,
//         "collection": {
//           "id": null,
//           "name": null
//         }
//       },
//       "orderId": "0x11eb3e8b5afc4e8a8639117c45b9c8711323adf88b0c8d6cc7425d9e2fe0a884",
//       "orderSource": "opensea.io",
//       "orderSide": "ask",
//       "orderKind": "wyvern-v2",
//       "from": "0x47940f6992d9d0c9d96e412623a75033285c2683",
//       "to": "0x7514c98e42ab83bc914411e18b7703f5c9699ae5",
//       "amount": "1",
//       "fillSource": "opensea.io",
//       "block": 12051742,
//       "txHash": "0x9d2cf197da3bfb02c1c7d7a0b0545f0dc5b1ab420bd1235021244c1b95ea6f45",
//       "logIndex": 72,
//       "batchIndex": 1,
//       "timestamp": 1615925216,
//       "price": {
//         "currency": {
//           "contract": "0x0000000000000000000000000000000000000000",
//           "name": "Ether",
//           "symbol": "ETH",
//           "decimals": 18
//         },
//         "amount": {
//           "raw": "1000000000000000000",
//           "decimal": 1,
//           "usd": 1791.04785,
//           "native": 1
//         },
//         "netAmount": {
//           "raw": "925000000000000000",
//           "decimal": 0.925,
//           "usd": 1656.71926,
//           "native": 0.925
//         }
//       },
//       "washTradingScore": 0,
//       "marketplaceFeeBps": 750,
//       "paidFullRoyalty": true,
//       "feeBreakdown": [
//         {
//           "kind": "marketplace",
//           "bps": 750,
//           "recipient": "0x5b3256965e7c3cf26e11fcaf296dfc8807c01073"
//         }
//       ],
//       "isDeleted": false,
//       "createdAt": "2021-03-16T20:06:56.000Z",
//       "updatedAt": "2023-04-03T11:51:58.115Z"
//     },
//     {
//       "id": "762a7337b40b01265bf292a61e76fbb2d62e3addb82d8d269bbdd851cfff5874",
//       "saleId": "84acd02fd732c50f29cb2aec106d6e30f418613cfdb26661e8d356be5f091f8b",
//       "token": {
//         "contract": "0x4ae57798aef4af99ed03818f83d2d8aca89952c7",
//         "tokenId": "705",
//         "name": null,
//         "image": null,
//         "collection": {
//           "id": null,
//           "name": null
//         }
//       },
//       "orderId": null,
//       "orderSource": null,
//       "orderSide": "ask",
//       "orderKind": "mint",
//       "from": "0x0000000000000000000000000000000000000000",
//       "to": "0x82397c3222c3797aa8c01eb05c316070281cd779",
//       "amount": "1",
//       "fillSource": null,
//       "block": 12050836,
//       "txHash": "0xd47c67264a911456af39cb02d2db52d129f0921885c1aafef2c9458ca1814444",
//       "logIndex": 266,
//       "batchIndex": 1,
//       "timestamp": 1615913720,
//       "price": {
//         "currency": {
//           "contract": "0x0000000000000000000000000000000000000000",
//           "name": "Ether",
//           "symbol": "ETH",
//           "decimals": 18
//         },
//         "amount": {
//           "raw": "528984000000000000",
//           "decimal": 0.52898,
//           "usd": 947.43566,
//           "native": 0.52898
//         }
//       },
//       "washTradingScore": 0,
//       "isDeleted": false,
//       "createdAt": "2023-01-27T18:34:47.516Z",
//       "updatedAt": "2023-01-27T18:34:47.516Z"
//     },
//     {
//       "id": "fa6bf116a08b90cb017fd7ba3a83245de9c9176b5f6f71c21778e95eb95260d4",
//       "saleId": "1de2a9d1d6010eca369bf77127ca79f9f77953ea79a6754f793596d8b388d53b",
//       "token": {
//         "contract": "0x4ae57798aef4af99ed03818f83d2d8aca89952c7",
//         "tokenId": "704",
//         "name": null,
//         "image": null,
//         "collection": {
//           "id": null,
//           "name": null
//         }
//       },
//       "orderId": null,
//       "orderSource": null,
//       "orderSide": "ask",
//       "orderKind": "mint",
//       "from": "0x0000000000000000000000000000000000000000",
//       "to": "0x47940f6992d9d0c9d96e412623a75033285c2683",
//       "amount": "1",
//       "fillSource": null,
//       "block": 12050834,
//       "txHash": "0x58cd3b550976f2d8fe7d0bb90f8e0fd9789828a876591adecf5bf17bddcc9d2b",
//       "logIndex": 149,
//       "batchIndex": 1,
//       "timestamp": 1615913688,
//       "price": {
//         "currency": {
//           "contract": "0x0000000000000000000000000000000000000000",
//           "name": "Ether",
//           "symbol": "ETH",
//           "decimals": 18
//         },
//         "amount": {
//           "raw": "522288000000000000",
//           "decimal": 0.52229,
//           "usd": 935.4428,
//           "native": 0.52229
//         }
//       },
//       "washTradingScore": 0,
//       "isDeleted": false,
//       "createdAt": "2023-01-27T18:34:47.516Z",
//       "updatedAt": "2023-01-27T18:34:47.516Z"
//     }
//   ],
//   "continuation": null
// }
// console.log(getSaleValueTotal(test))
// getCollectionSalesTotals('0x4ae57798aef4af99ed03818f83d2d8aca89952c7',[704,705]).then((r)=>console.log(r))