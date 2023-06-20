// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

//-- _____ ______    ________   ________    _________   ________   ________   _______      
//--|\   _ \  _   \ |\   __  \ |\   ___  \ |\___   ___\|\   __  \ |\   ____\ |\  ___ \     
//--\ \  \\\__\ \  \\ \  \|\  \\ \  \\ \  \\|___ \  \_|\ \  \|\  \\ \  \___| \ \   __/|    
//-- \ \  \\|__| \  \\ \  \\\  \\ \  \\ \  \    \ \  \  \ \   __  \\ \  \  ___\ \  \_|/__  
//--  \ \  \    \ \  \\ \  \\\  \\ \  \\ \  \    \ \  \  \ \  \ \  \\ \  \|\  \\ \  \_|\ \ 
//--   \ \__\    \ \__\\ \_______\\ \__\\ \__\    \ \__\  \ \__\ \__\\ \_______\\ \_______\
//--    \|__|     \|__| \|_______| \|__| \|__|     \|__|   \|__|\|__| \|_______| \|_______|
//--                                                                                       
//-- 
//-- Montage.io     

import {OperatorFilterer} from "./OperatorFilterer.sol";
import {IERC2981, ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract NFTcontract is ERC721, OperatorFilterer, ERC2981 {
    bool public operatorFilteringEnabled;
    uint256 public maxSupply;
    string public baseURI;
    bool public updateBaseURIStatus;
    bool public putCap;
    address public collectAddress;
    address public _owner;
    uint256 private minPresalePrice;
    uint256 private minPublicSalePrice;
    uint256 private maxMintPerWallet;
    address public admin;
    uint256 public stage; //0=INACTIVE 1=PREMINT 2=PUBLIC
    uint256 public totalSupply = 1;
    

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokenMinted(uint256 indexed firstId, uint256 mintQty, address indexed contractAddress, address indexed minter);
    event TokensMinted(uint256 mintQty, address indexed contractAddress, address indexed minter);
    event EthSent(string indexed _function, address sender, uint value, bytes data);

    error OperatorNotAllowed(address operator);
    error CallNotAllowed(uint256 times);
    error ExceedsMaxSupply();
    error InputInvalidData();
    error TransferETHFailed();
    error Unauthorized(address caller);
    error NotExistedToken(uint256 tokenid);
    error TokenIdTaken(uint256 tokenid);

    modifier canMint(uint256 numberOfTokens, uint256 tokenId) {
        _canMint(numberOfTokens, tokenId);
        _;
    }

    modifier onlyOwner() {
         require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    modifier onlyOwnerOrAdmin() {
         require(msg.sender == _owner || msg.sender == admin, "Ownable: caller is not authorized");
        _;
    }

    modifier isMintActive() {
        require(stage != 0, "Minting is not currently active.");
        _;
    }
    
    constructor(
        address _collectAddress,
        address _deployer,
        string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _maxSupply,
        uint96 _royalty
    ) ERC721(_tokenName, _tokenSymbol) {
        _registerForOperatorFiltering();
        operatorFilteringEnabled = true;
        _setDefaultRoyalty(_collectAddress, _royalty);
        maxSupply = _maxSupply;
        collectAddress = _collectAddress;
        _owner = _deployer;
        admin = _deployer;
        baseURI = "https://montage.infura-ipfs.io/ipfs/QmPaYH7MVVoUGHzF8yK1Gp6isBqqZprMUoEjpEQXvn6Xk8";
       
    }

    receive() external payable {
        emit EthSent("receive()", msg.sender, msg.value, "");
    }
    
    /**
    * @dev _canMint
    * Make sure number of tokens does not exceed max supply
    * Make sure token ID is not higher than max supply
    * Make sure token ID isn't already minted
    */
    function _canMint(uint256 _numberOfTokens, uint256 _tokenId) internal view  {
        if (maxSupply > 0) {
            uint256 num = totalSupply + _numberOfTokens;
            uint256 maxId = maxSupply;
            if (num > maxId || _tokenId > maxId) {
                revert ExceedsMaxSupply();
            }
        }
    }

    function updateMaxSupply(uint256 _supply) external onlyOwnerOrAdmin {
        maxSupply = _supply;
    }

    function setMaxPerWallet(uint256 _max) external onlyOwnerOrAdmin {
        maxMintPerWallet = _max;
    }

    function setMinPrices(uint256 _pre, uint256 _pub) external onlyOwnerOrAdmin {
        minPresalePrice = _pre;
        minPublicSalePrice = _pub;
    }

    function setStage(uint256 _stage) external onlyOwnerOrAdmin {   
        require(_stage == 0 || _stage == 1 || _stage == 2, "Invalid stage. 0=INACTIVE 1=PREMINT 2=PUBLIC");
        stage = _stage;
    }

    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
    }

    // ============ MULTI-MINT ============
    function mintWithQTY(uint256 _tokenAmt, address[] calldata _artistAddresses)
        external
        payable
        isMintActive()
        
    {   
        require(_tokenAmt > 0, "Mint at least 1 token.");
        require(_artistAddresses.length == _tokenAmt, "Mismatch in array lengths");

         uint256 _totalSupply = totalSupply;
        if (maxSupply > 0) {
            require(maxSupply > (_tokenAmt + _totalSupply), "Exceeds available supply."); 
        }
        if (maxMintPerWallet > 0) {
            require(_tokenAmt + ERC721.balanceOf(msg.sender) <= maxMintPerWallet, "Exceeds max amount of tokens per wallet address."); 
        }
        uint256 stageMinPrice = stage == 1 ? minPresalePrice : minPublicSalePrice;
        if (stageMinPrice > 0) {
            require(msg.value > stageMinPrice * _tokenAmt, "Amount of ether sent not enough for min price per token."); 
        }
       
        uint256[] memory _tokens = new uint[](_tokenAmt);

        for(uint256 i; i < _tokenAmt; i++) { 
            
            _mint(msg.sender, _totalSupply);
            _tokens[i] = _totalSupply;
            unchecked {
                _totalSupply++;
            }
           
        }
        totalSupply = _totalSupply;
        (bool success,) = payable(collectAddress).call{value: msg.value}(abi.encodeWithSignature("receiveMultiMintPayment(uint256[],address[],address)", _tokens, _artistAddresses, msg.sender));
        require(success);

        emit TokensMinted(_tokenAmt, address(this), msg.sender);
    }

    // ============ MINT WITH ID ============
    function mintWithID(address _artist, uint256 _tokenId)
        public
        payable
        isMintActive()
        canMint(1, _tokenId)
    { 
        uint256 _totalSupply = totalSupply;

        if (maxSupply > 0) {
            require(maxSupply > _totalSupply + 1, "Exceeds available supply."); 
        }
        if (maxMintPerWallet > 0) {
            require(ERC721.balanceOf(msg.sender) < maxMintPerWallet, "Exceeds max amount of tokens per wallet address."); 
        }
        uint256 stageMinPrice = stage == 1 ? minPresalePrice : minPublicSalePrice;
        if (stageMinPrice > 0) {
            require(stageMinPrice < msg.value, "Amount of ether sent not enough for min price per token."); 
        }
        
        _mint(msg.sender, _tokenId);
        unchecked {
            _totalSupply++;
        }
        totalSupply = _totalSupply;
  
        (bool success,) = payable(collectAddress).call{value: msg.value}(abi.encodeWithSignature("receiveMintPayment(uint256,address,address)", _tokenId, _artist, msg.sender));
        require(success);
        emit TokenMinted(_tokenId, 1, address(this), msg.sender);
    }

    // ============ MINT FOR ONLY OWNER ============
    function selfMint(uint256 _numberOfTokens)
        public
        isMintActive()
        canMint(_numberOfTokens, 0)
        onlyOwner
    {   
        uint256 _totalSupply = totalSupply;
        if (maxSupply > 0) {
            require(maxSupply > (_numberOfTokens + _totalSupply), "Exceeds available supply."); 
        }

        for (uint256 i; i < _numberOfTokens; i++) {
             _mint(msg.sender, _totalSupply);
            unchecked{
                _totalSupply++;
            }
        }
        totalSupply = _totalSupply;
        
        emit TokensMinted(_numberOfTokens, address(this), msg.sender);
    }

    // ============ FUNTION TO READ TOKENRUI ============
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (_exists(_tokenId) == false) {
            revert NotExistedToken(_tokenId);
        }
        if (updateBaseURIStatus == false) {
            return string(abi.encodePacked(baseURI));
        }
        return
            string(
                abi.encodePacked(
                    baseURI,
                    Strings.toString(_tokenId),
                    ".json"
                )
            );
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }
    
    function _transferOwnership(address newOwner) internal {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ============ FUNCTION TO UPDATE ETH COLLECTADDRESS ============
    function setCollectAddress(address _collectAddress) external onlyOwnerOrAdmin {
        // TODO ensure that _collectAddress is a Buffer contract?
        collectAddress = _collectAddress;
    }

    // ============ FUNCTION TO UPDATE BASEURIS ============
    function updateBaseURI(string calldata _baseURI) external onlyOwnerOrAdmin {
        if (putCap == true) {
            revert InputInvalidData();
        }
        updateBaseURIStatus = true;
        baseURI = _baseURI;
    }
    
    // ============ FUNCTION TO TRIGGER TO CAP THE SUPPLY ============
    function capTrigger(bool _putCap) external onlyOwnerOrAdmin {
        putCap = _putCap;
    }
    
    function setApprovalForAll(address operator, bool approved)
        public
        override
        onlyAllowedOperatorApproval(operator)
    {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId)
        public
        override
        onlyAllowedOperatorApproval(operator)
    {
        super.approve(operator, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId)
        public
        override
        onlyAllowedOperator(from)
    {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId)
        public
        override
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981)
        returns (bool)
    {
        // Supports the following `interfaceId`s:
        // - IERC165: 0x01ffc9a7
        // - IERC721: 0x80ac58cd
        // - IERC721Metadata: 0x5b5e139f
        // - IERC2981: 0x2a55205a
        return ERC721.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwnerOrAdmin {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setOperatorFilteringEnabled(bool value) public onlyOwnerOrAdmin {
        operatorFilteringEnabled = value;
    }

    function _operatorFilteringEnabled() internal view override returns (bool) {
        return operatorFilteringEnabled;
    }

    function _isPriorityOperator(address operator) internal pure override returns (bool) {
        // OpenSea Seaport Conduit:
        // https://etherscan.io/address/0x1E0049783F008A0085193E00003D00cd54003c71
        // https://goerli.etherscan.io/address/0x1E0049783F008A0085193E00003D00cd54003c71
        return operator == address(0x1E0049783F008A0085193E00003D00cd54003c71);
    }
}