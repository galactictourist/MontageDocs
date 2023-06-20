//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Buffer is Initializable {

    event PaymentWithdrawn(address indexed member, uint256 indexed amount);
    error TransferFailed();

    modifier onlyOwner() {
        require(owner == msg.sender, "Caller is not the owner.");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    modifier onlyOwnerOrAdmin() {
         require(msg.sender == owner || msg.sender == admin, "Ownable: caller is not authorized");
        _;
    }

    struct Mint {
        uint256 coreTeamPerc;
        uint256 allArtistsPerc;
        uint256 singleArtistPerc;
        uint256 allHoldersPerc;
        uint256 adminPerc;
    }
    struct Postmint {
        uint256 coreTeamPerc;
        uint256 allArtistsPerc;
        uint256 singleArtistPerc;
        uint256 allHoldersPerc;
        uint256 adminPerc;
    }

    mapping(address => uint256) private balances; // Mapping of balances for each address
    mapping(address => uint256) private coreTeamPercents;
    mapping(address => uint256) private artistMintCounters;
    mapping(address => uint256) private holderNFTCounters; 
    mapping(address => uint256) private secondarySalesAmount;

    mapping(address => uint256) public totalWithdrawn;
    mapping(address => uint256) public totalDonated;

    mapping(uint256 => address) private nftIdToArtist;
    uint256 public coreTeamBalance;
    uint256 public allArtistsBalance;
    uint256 public allHoldersBalance;

    mapping(address => uint256) private withdrewFromPoolsUpTo;
    mapping(address => uint256) private donatedFromPoolsUpTo;
    uint256 private lastPayEventId;

    Mint public mintPercents;
    Postmint public postMintPercents;
    uint256 public nftsMinted;
    bool public paused;
    address public owner;
    address public admin;
    bool public sharesSet;//are mint and post mint shares set?
    
    function initialize(address _owner) public payable initializer {
        owner = _owner;
    }

    receive() external payable {
        secondarySalesAmount[msg.sender] += msg.value;
    }

    function setPaused(bool _paused) public onlyOwnerOrAdmin {
        paused = _paused;
    }

    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
    }

    function viewTotalWithdrawn(address member) external view returns(uint256) {
        return totalWithdrawn[member];
    }

    function viewTotalDonated(address member) external view returns(uint256) {
        return totalDonated[member];
    }

    function setPercentsAndAddCoreTeam(
        uint256[] calldata values,
        address[] calldata coreTeamAddresses,
        uint256[] calldata c_teamPercs
    ) external payable onlyOwnerOrAdmin {
        require(
            values.length == 10,
            "There must be 10 uint256 values for the percentages"
        );
        postMintPercents.coreTeamPerc = values[0];
        postMintPercents.allArtistsPerc = values[1];
        postMintPercents.singleArtistPerc = values[2];
        postMintPercents.allHoldersPerc = values[3];
        postMintPercents.adminPerc = values[4];
        mintPercents.coreTeamPerc = values[5];
        mintPercents.allArtistsPerc = values[6];
        mintPercents.singleArtistPerc = values[7];
        mintPercents.allHoldersPerc = values[8];
        mintPercents.adminPerc = values[9];

        if (coreTeamAddresses.length > 0) {
            require(
                coreTeamAddresses.length == c_teamPercs.length,
                "Each team member needs a share % in BPS format"
            );
            for (uint i; i < coreTeamAddresses.length; i++) {
                address coreTeamAddress = coreTeamAddresses[i];
                coreTeamPercents[coreTeamAddress] = c_teamPercs[i];
                balances[coreTeamAddress] = 0;
            }
        }
        sharesSet = true;
    }

    function addArtistsAndNFTs(
        address[] calldata artistAddresses,
        uint256[][] calldata nftIds
    ) external onlyOwnerOrAdmin {
        require(
            artistAddresses.length == nftIds.length,
            "Mismatch in array lengths"
        );
        for (uint16 i; i < artistAddresses.length; i++) {
            address artistAddress = artistAddresses[i];
            artistMintCounters[artistAddress] = 0;
            balances[artistAddress] = 0;
            uint256[] calldata artistNFTs = nftIds[i];
            for (uint16 j; j < artistNFTs.length; j++) {
                nftIdToArtist[artistNFTs[j]] = artistAddress;
            }
        }
    }
        
    function receiveMintPayment( 
        uint256 tokenId,
        address artistAddress,
        address buyerAddress
    ) public payable {
        lastPayEventId += 1;
        nftsMinted += 1;
        uint256 amount = msg.value;

        artistMintCounters[artistAddress] += 1;
        balances[artistAddress] += amount * mintPercents.singleArtistPerc / 10000;
        allArtistsBalance += amount * mintPercents.allArtistsPerc / 10000;
        
        holderNFTCounters[buyerAddress] += 1;
        allHoldersBalance += amount * mintPercents.allHoldersPerc / 10000;
        
        balances[owner] += amount * mintPercents.adminPerc / 10000;
        coreTeamBalance += amount * mintPercents.coreTeamPerc / 10000;
        nftIdToArtist[tokenId] = artistAddress;
    }

    function receiveMultiMintPayment( 
        uint256 [] calldata tokens,
        address [] calldata artistAddys,
        address buyerAddress
    ) public payable {
        lastPayEventId += 1;
        nftsMinted += tokens.length;
        uint256 amount = msg.value;
         
        for (uint16 i; i < tokens.length; i++) {
            address artistAddress = artistAddys[i];

            artistMintCounters[artistAddress] += 1;
            balances[artistAddress] += amount * mintPercents.singleArtistPerc / 10000;
            allArtistsBalance += amount * mintPercents.allArtistsPerc / 10000;
            
            nftIdToArtist[tokens[i]] = artistAddress;
        }

        holderNFTCounters[buyerAddress] += tokens.length;
        allHoldersBalance += amount * mintPercents.allHoldersPerc / 10000;

        balances[owner] += amount * mintPercents.adminPerc / 10000;
        coreTeamBalance += amount * mintPercents.coreTeamPerc / 10000;
    }

    function receiveSalePayment(
        uint256 tokenId,
        address sellerAddress,
        address buyerAddress
    ) public payable {
        lastPayEventId += 1;
        uint256 amount = msg.value;
       
        balances[nftIdToArtist[tokenId]] += amount * postMintPercents.singleArtistPerc / 10000;
        allArtistsBalance += amount * postMintPercents.allArtistsPerc / 10000;

        if (sellerAddress != buyerAddress) {
            holderNFTCounters[sellerAddress] -= 1;
            holderNFTCounters[buyerAddress] += 1;
        }
        allHoldersBalance += amount * postMintPercents.allHoldersPerc / 10000;
        
        balances[owner] += amount * postMintPercents.adminPerc / 10000;
        coreTeamBalance += amount * postMintPercents.coreTeamPerc / 10000;
    }

    function ownerWithdraw() external onlyOwner {
        require(balances[owner] != 0, "No balance to withdraw at this time");
        uint256 amount = balances[owner];
        (bool success,) = payable(msg.sender).call{value: amount}("");
        amount = 0;
        if(!success){ // catch the case where the send was unsuccesful
            amount = balances[owner];
        } else {
            balances[owner] = 0;
            emit PaymentWithdrawn(msg.sender, amount);
        }
    }

    function viewDonationAmt(address member) external view returns(uint256) {
        uint256 _amount = 0;
        if (donatedFromPoolsUpTo[member] < lastPayEventId && nftsMinted > 0) {
            _amount += allHoldersBalance * holderNFTCounters[member] / nftsMinted;
        }
        return _amount;
    }

    function viewEarnings(address member) external view returns(uint256) {
        uint256 _amount = balances[member];
        if (withdrewFromPoolsUpTo[member] < lastPayEventId) {
            _amount += coreTeamBalance * coreTeamPercents[member] / 10000;
            if (nftsMinted > 0) {
                _amount += allArtistsBalance * artistMintCounters[member] / nftsMinted;
            }
        }
        return _amount;
    }

	function withdraw() external whenNotPaused {
        uint256 _coreTeamShare = 0;
        uint256 _allArtistsShare = 0;
        if (withdrewFromPoolsUpTo[msg.sender] < lastPayEventId) {
            _coreTeamShare = coreTeamBalance * coreTeamPercents[msg.sender] / 10000;
            if (nftsMinted > 0) {
                _allArtistsShare = allArtistsBalance * artistMintCounters[msg.sender] / nftsMinted;
            }
        }
        uint256 _amount = balances[msg.sender] + _coreTeamShare + _allArtistsShare;

        require(_amount > 0, "Insufficient balance.");
        address payable _account = payable(msg.sender);
        balances[msg.sender] = 0;

        bool callStatus;
        assembly {
            callStatus := call(gas(), _account, _amount, 0, 0, 0, 0)
        }
        if (callStatus) {
            totalWithdrawn[msg.sender] += _amount;
            if (withdrewFromPoolsUpTo[msg.sender] < lastPayEventId) {
                withdrewFromPoolsUpTo[msg.sender] = lastPayEventId;
                coreTeamBalance -= _coreTeamShare;
                allArtistsBalance -= _allArtistsShare;
            }
            emit PaymentWithdrawn(_account, _amount);
        } else {
            revert TransferFailed();
        }
    }

    function holderDonate(address donateTo) external whenNotPaused {
        address payable _payableDonateTo = payable(donateTo);
        uint256 _amount = 0;
        if (donatedFromPoolsUpTo[msg.sender] < lastPayEventId && nftsMinted > 0) {
            _amount = allHoldersBalance * holderNFTCounters[msg.sender] / nftsMinted;
        }

        require(_amount > 0, "Insufficient balance.");

        bool callStatus;
        assembly {
            callStatus := call(gas(), _payableDonateTo, _amount, 0, 0, 0, 0)
        }
        if (callStatus) {
            totalDonated[msg.sender] += _amount;
            donatedFromPoolsUpTo[msg.sender] = lastPayEventId;
            allHoldersBalance -= _amount;
            emit PaymentWithdrawn(msg.sender, _amount);
        } else {
            revert TransferFailed();
        }
    }		
}