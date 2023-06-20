const liveCollections = require("./data/liveCollections")
const users = require("./data/users")
const collections = require("./data/collections")
const items = require("./data/items")
const props = require("./data/props")
const emails = require("./emails")
const crypto = require("./crypto")
const admin = require('firebase-admin')
const nfts = require('./web3/nfts')
const sign = require('./web3/sign')
const db = require('./data/db')
const originalImages = require('./data/originalImages')
const artShowcase = require('./data/artShowcase')
const ipfs = require('./ipfs')
const tx = require('./data/tx')

admin.initializeApp()

exports.signMessage = sign.signMessage
exports.addValidPayee = sign.addValidPayee

exports.scanAndDealAdminOnly = tx.scanAndDealAdminOnly
exports.withdrawWaitingFunds = tx.withdrawWaitingFunds
// exports.transfer = tx.transfer
exports.feeReceived = tx.feeReceived
exports.scanAndDealEveryMinute = tx.scanAndDealEveryMinute

exports.unpinFromIPFS = ipfs.unpinFromIPFS
exports.sendToIPFS = ipfs.sendToIPFS

exports.deleteAllCollecitonItems = items.deleteAllCollecitonItems

exports.updateArtShowcase = artShowcase.updateArtShowcase
exports.loadArtShowcase = artShowcase.loadArtShowcase

exports.saveOriginalImage = originalImages.saveOriginalImage
exports.loadOriginalImage = originalImages.loadOriginalImage

exports.getNVarcharLimits = db.getNVarcharLimits

exports.loadCreatorMintedTokenIds = liveCollections.loadCreatorMintedTokenIds
exports.loadUserLiveCollections = liveCollections.loadUserLiveCollections
exports.getMyListedItems = liveCollections.getMyListedItems
exports.listCollectionItems = liveCollections.listCollectionItems
exports.loadTotalItemsToMint = liveCollections.loadTotalItemsToMint
exports.loadItemsToMint = liveCollections.loadItemsToMint
exports.getMintPriceETH = liveCollections.getMintPriceETH
exports.loadCollectionIdByNFTAddress = liveCollections.loadCollectionIdByNFTAddress
exports.updateLiveCollectionConductKey = liveCollections.updateLiveCollectionConductKey
exports.uploadApprovedItemsMetadata = liveCollections.uploadApprovedItemsMetadata
exports.getCollectionSummeryLocal = liveCollections.getCollectionSummeryLocal
exports.getNFTDetailsLocal = liveCollections.getNFTDetailsLocal
exports.loadNonMintedItemsCount = liveCollections.loadNonMintedItemsCount
exports.updateBoughtItems = liveCollections.updateBoughtItems
exports.getUserSplitterAddresses = liveCollections.getUserSplitterAddresses
exports.getEarnings = liveCollections.getEarnings
exports.loadLiveCollection = liveCollections.loadLiveCollection
exports.loadArtistAddresses = liveCollections.loadArtistAddresses
exports.createLiveCollection = liveCollections.createLiveCollection

exports.getCollectionSalesTotals = nfts.getCollectionSalesTotals
exports.getMultipleNFTs = nfts.getMultipleNFTs
exports.getWalletNFTs = nfts.getWalletNFTs
exports.getNFTDetails = nfts.getNFTDetails
exports.getCollectionSummery = nfts.getCollectionSummery
exports.getMetadataDetail = nfts.getMetadataDetail
exports.getTokenTxHistory = nfts.getTokenTxHistory
exports.getCollectionTxHistory = nfts.getCollectionTxHistory

exports.loadReferrals = users.loadReferrals
exports.getUserId = users.getUserId
exports.loadUserProfile = users.loadUserProfile
exports.loadMayAddCollection = users.loadMayAddCollection
exports.createUser = users.createUser
exports.updateUser = users.updateUser
exports.searchUsers = users.searchUsers
exports.findUserByWalletAddress = users.findUserByWalletAddress

exports.loadCollectionArtists = collections.loadCollectionArtists
exports.loadCuratorAddress = collections.loadCuratorAddress
exports.mergeCreationStages = collections.mergeCreationStages
exports.loadCreationStages = collections.loadCreationStages
exports.loadCurrentMintStage = collections.loadCurrentMintStage
exports.loadCurrentSchedule = collections.loadCurrentSchedule
exports.mergeSchedule = collections.mergeSchedule
exports.loadSchedule = collections.loadSchedule
exports.loadMyCollectionBasics = collections.loadMyCollectionBasics
exports.loadMyCollections = collections.loadMyCollections
exports.loadMyCollectionStory = collections.loadMyCollectionStory
exports.createCollection = collections.createCollection
exports.updateCollection = collections.updateCollection
exports.createUserCollection = collections.createUserCollection
exports.addUserCollectionRoles = collections.addUserCollectionRoles
exports.removeUserCollectionRoles = collections.removeUserCollectionRoles
exports.loadCollectionPies = collections.loadCollectionPies
exports.mergeCollectionPie = collections.mergeCollectionPie
exports.loadCollectionRights = collections.loadCollectionRights
exports.loadCollectionSettings = collections.loadCollectionSettings
exports.createTeammate = collections.createTeammate
exports.deleteAllCollectionItems = collections.deleteAllCollectionItems
exports.checkAllowList = collections.checkAllowList
exports.getMintedNFTPerWallet = collections.getMintedNFTPerWallet

exports.loadTeamForStory = collections.loadTeamForStory
exports.loadTeam = collections.loadTeam
exports.deleteTeammate = collections.deleteTeammate
exports.updatePublicProfile = collections.updatePublicProfile
exports.updateTeamShares = collections.updateTeamShares

exports.createCreator = collections.createCreator
exports.loadCreators = collections.loadCreators
exports.deleteCreator = collections.deleteCreator

exports.createMember = collections.createMember
exports.loadCommunity = collections.loadCommunity
exports.deleteMember = collections.deleteMember



exports.updateMintedStatus = items.updateMintedStatus
exports.setMintingStatus = items.setMintingStatus
exports.approveAllItems = items.approveAllItems
exports.tokenMinted = items.tokenMinted
exports.loadCurrentItemsCount = items.loadCurrentItemsCount
exports.loadItemDetails = items.loadItemDetails
exports.loadItem = items.loadItem
exports.createItem = items.createItem
exports.updateItem = items.updateItem
exports.loadItemsCreatedByMe = items.loadItemsCreatedByMe
exports.loadMyFollowing = items.loadMyFollowing
exports.loadCollectionItems = items.loadCollectionItems
exports.loadCollectionMyItems = items.loadCollectionMyItems
exports.addUserItemRoles = items.addUserItemRoles
exports.removeUserItemRoles = items.removeUserItemRoles

exports.loadProps = props.loadProps
exports.loadOptions = props.loadOptions
exports.loadItemOptions = props.loadItemOptions
exports.createProp = props.createProp
exports.createOption = props.createOption
exports.mergeItemOptions = props.mergeItemOptions
exports.deleteOption = props.deleteOption
exports.deleteProp = props.deleteProp
exports.updateProp = props.updateProp
exports.updateOption = props.updateOption

exports.sendConfirmationEmail = emails.sendConfirmationEmail
exports.sendRequestToAddCollection = emails.sendRequestToAddCollection
exports.sendOfferToSeller = emails.sendOfferToSeller
exports.sendOfferAcceptedToBuyer = emails.sendOfferAcceptedToBuyer

exports.encryptForInviteLink = crypto.encryptForInviteLink
exports.decrypt = crypto.decrypt