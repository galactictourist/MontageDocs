import './faq.scss'

export default function FAQ() {
	return (
		<div className="app-faq">
			<Title>About Montage</Title>

			<Question>What is Montage?</Question>
			<Answer>Montage is a no-code minting and smart contract platform that simplifies the deployment, management, and monetization of digital assets. Our technology streamlines the entire NFT lifecycle, from minting to royalties and collection management, allowing for effortless NFT deployment and management. With on-chain royalties for all artists, collectors, and teams, Montage is the ultimate solution for monetizing digital assets.</Answer>

			<Question>How is your contract different?</Question>
			<Answer>
				At Montage, we strive to build for the community. Our smart contract platform puts the power back where it belongs: in the hands of creators, curators, and collectors like you. With Montage, you have complete control over your NFTs, from enforcing royalties to receiving payments every time your NFT sells. We believe that everyone deserves a fair shot at success in the digital art world, and we're here to make that a reality.
				<br /><br />
				Our progressive decentralized framework extends the ERC-721 token standard, giving artists, collectors, and teams like yours the ability to easily set and receive continuous on-chain royalties every time your NFT mints or sells. With granular control over royalty distribution, you have the power to create new community enrichment and incentivization strategies that truly set your NFT apart. Montage is the future of NFTs, and we're proud to help you be a part of it.
			</Answer>

			<Question>Why is your contract better for artists?</Question>
			<Answer>
				Our contract is better for artists for a few reasons:
				<ul>
					<li>Ease of use - no-code or devs needed.</li>
					<li>Fairness - The artist's share of the profit from the mint or sale of an item is separated from the share that goes to the core team. This way the collectors see what portion of the sale price goes directly to the artist.</li>
					<li>Royalties - We enforce royalties on our platform and Montage minted NFTs cannot be sold on 3rd party marketplaces that do not also enforce royalties. We also offer an exclusive feature where any artist who contributes to a collection will receive a share of the royalties based on all sales within the collection regardless of sales activity from their own NFTs.</li>
					<li>Holder Gamification - Artists can reward existing holders by sharing royalties among all existing holders with each new sale. This feature is exclusive to the Montage "Evolving Collection.”</li>
				</ul>
			</Answer>

			<Question>Why is your contract better for holders?</Question>
			<Answer>With our holders' royalties,  holders can passively receive royalties for owning, and They will  benefit from every sale in the collection as long as they are holding items from that specific collection (see answer about holders royalties)</Answer>

			<Question>Why is your platform better for teams?</Question>
			<Answer>Montage makes it possible for different teams and team members to be added to receive different revenue share amounts every time there’s a mint or sale. Core teams and teams of artists are also separated in different royalty split categories as well to keep the Proof of Transparency clean.</Answer>

			<Title>Royalties</Title>
			<Question>Why are you pro royalties?</Question>
			<Answer>At the heart of the web3 ecosystem and NFT community are the talented and imaginative creators, artists, and entrepreneurs. Their unending creativity and innovative ideas are driving a new era of art and expression. One of the most exciting things about NFTs is that creators can continue to reap the rewards of their hard work and artistry, just as we can continue to enjoy and admire their creations.</Answer>

			<Question>Do you think royalties should be limited?</Question>
			<Answer>In some cases, creators may experience limitations on their royalties, but we believe this should always be a choice made by the creators themselves, not imposed by collectors or marketplaces. That's why we're actively working on collections that empower creators to set their own limits, and beyond that, their share can be donated to charity or distributed to collectors. We believe that the distribution of royalties plays a crucial role in the ongoing evolution, growth, and widespread adoption of the NFT community. By fairly compensating creators for their hard work and artistic talent, we can ensure that this ecosystem continues to flourish and attract talented individuals.</Answer>

			<Question>Do you think collection founders and teams should specify the artist share?</Question>
			<Answer>We believe that transparency and fairness are key in supporting the creative community. That's why we specify the artist's share in our collections. It's important to clearly communicate and showcase what the actual creative person is receiving, especially in cases where more business-savvy parties might profit at their expense.</Answer>

			<Question>How do you enforce royalties?</Question>
			<Answer>
				Enforcing royalties is a complex issue and there is no foolproof solution. At Montage, we aim to create a trusted and secure platform for NFT trading, and to that end, we have identified 7 levels of protection to help enforce royalties:
				<ul>
					<li>Market Restrictions: Our platform currently restricts NFT trading to specific, royalty-enforcing marketplaces. We offer NFT trading in our collection marketplace, as well as in the two biggest marketplaces that enforce royalties, Opensea and X2Y2.</li>
					<li>IP Revocation: Collection founders will have the option to revoke IP rights for NFTs that trade without paying royalties.</li>
					<li>Utility Revocation: Similar to IP revocation, utility rights can also be revoked for NFTs that trade without royalties.</li>
					<li>Asset Modification: Trades without royalties can result in changes to the NFT's image or traits to indicate that IP rights have been revoked.</li>
					<li>Withdrawal Restrictions: In the future, we may implement a system that revokes the ability to withdraw funds for NFTs that have traded without paying royalties.</li>
					<li>Shame/Blocklist: Understanding royalty enforcement will need to be on a social contract level, we plan to create a universal list of wallets that trade NFTs without paying royalties and restrict their access to the collection marketplace.</li>
					<li>Transfer Enforcement: This is the most complex and difficult to implement, but we are working on a system that will allow collection founders to enforce royalty payments on transfers. This will require a system that can verify the royalty payment on the blockchain, and we are currently exploring the best way to implement this.</li>
				</ul>
				We understand none of those are perfect, and we are dedicated to finding the best solutions to enforce royalties and welcome everyone to explore this issue with us.
			</Answer>

			<Question>What are  all artists’ share/royalties</Question>
			<Answer>
				We believe in fairly compensating artists for their contributions to a collection. Collection founders have the ability to set a royalty percentage that will be divided among all artists in the collection whenever an item is minted or sold. This is In addition to the royalty share each artist will receive a portion of the sales revenue as the creator of the specific item.
				<br />
				To ensure fairness, the all-artists' royalty share is divided based on the number of minted items each artist has in the collection. This means that an artist with ten minted items will receive ten times more royalties than an artist with one minted item. These royalty splits according to on-chain data and is updated regularly, typically once a minute or so  after each chain update.
				<br />
				Our goal is to support and compensate artists for their hard work, and we are committed to providing a transparent and equitable royalty system.
			</Answer>

			<Question>What is All holders' share/royalties?</Question>
			<Answer>
				The “All holders' royalties, is a portion of the revenue generated from the minting or sale of any NFT in the collection. This share, which is set by the collection founder prior to deploying the contract, is distributed among all current holders of the collection.
				<br />
				“All holders' share is divided based on the number of NFTs held by each collector. This means that the more NFTs you hold, the larger your share of the royalties will be. The division of these royalties is performed regularly, according to on-chain data, typically every minute or so after the chain is updated.
				<br />
				This feature provides a way for all collectors to benefit from the success of the collection, ensuring that everyone involved has a stake in its growth and prosperity.
			</Answer>

			<Question>Why do we believe in royalties for holders?</Question>
			<Answer>
				The distribution of all holders' royalties creates a sense of community and shared ownership among collectors. By providing a reward for simply holding NFTs within the collection, it encourages collectors to invest in the collection and help drive its growth and success.
				<br />
				With this system in place, everyone has a vested interest in the success of the collection, creating a thriving and sustainable ecosystem that benefits everyone involved. Whether you're a collector, an artist, or a creator, all holders' royalties provide a way for you to reap the rewards of your involvement in the collection.
			</Answer>

			<Question>How does the holder's royalties help a one-of-one artist?</Question>
			<Answer>
				As a one of one artist, it's crucial to keep a strong connection with your collectors and make them feel valued. By putting all of your artwork into one evolving collection, you can reward your current holders with a small share of the revenue every time you mint or sell a new piece. This serves as a special token of appreciation for their loyalty, and a way to keep them updated and excited about your newest creations!
			</Answer>

			<Title>Decentralization</Title>
			<Question>Are you fully decentralized?</Question>
			<Answer>
				As decentralization maxis and optimists, we recognize that decentralization is a sliding scale and not a binary issue. Achieving a balance between decentralization and other factors such as user experience, gas prices, security, self-sovereignty, and innovation is crucial. Currently, we are progressively decentralized as we perform some calculations off-chain and own the contracts to simplify access to information and accounts, reducing gas costs for splitting royalties among groups designated by the curator/artist. While full decentralization is our ultimate goal, we continue to work towards it as our technology, and the web3 ecosystem continues to evolve. It is important to note that the NFT contracts created by the Montage platform are fully owned by the originator of the collection.
			</Answer>

			<Question>Why are you not 100% decentralized?</Question>
			<Answer>
				To ensure seamless transfer of royalties to all parties involved and to provide a user-friendly interface for withdrawals. Rest assured, our ownership does not grant us any control over the contract or its decisions, which are solely reserved for the collection's administrator/curator. Our platform simply facilitates the automatic splitting of royalties. To further our commitment to decentralization, we are developing an API that will allow collection administrators to take full ownership of the contract if they so desire. If you would like to manage the contract and royalties independently, please do not hesitate to reach out to us.
			</Answer>

			<Question>What is “Lazy withdrawal” and Why do you ask users to withdraw funds instead of sending them their funds directly to their wallets?</Question>
			<Answer>
				Let us clarify holding funds is not our preferred method of operation as it creates an added responsibility for us. The reason we don't immediately transfer royalties to individual wallets is due to the possibility of high gas fees, which could result in the recipient losing a significant portion of their royalties and, in some cases, paying more in gas fees than the actual amount of royalties received. To mitigate this issue, our withdrawal page allows you to choose the timing of your withdrawals, and our automatic withdrawal option enables you to set a threshold amount so that we can handle the transfer for you, saving you time and effort.
			</Answer>

			<Question>How much does it cost to withdraw my royalties?</Question>
			<Answer>
				With every transfer on the Ethereum blockchain comes a gas fee. When you withdraw your funds, we deduct the estimated gas fee from the balance, so you may have a very small amount left for your next withdrawal. To minimize the cost for you, we aim to schedule auto-withdrawals during periods of low gas fees. Additionally, we charge a nominal fee of 0.000064 ETH, which is about $0.1, to cover our split calculation costs. As we grow, we hope to improve and lower these fees for you and we're exploring options such as utilizing alternative blockchain networks like Polygon, where we can perform all calculations on-chain, potentially eliminating these fees altogether.
			</Answer>

			<Question>Can I withdraw my funds at any time?</Question>
			<Answer>
				Yes, you can either withdraw as you please, or you can set an automatic withdrawal amount that will trigger the Montage system to send the royalties to your wallet once it hits that set amount. To maximize earnings, we recommend timing your withdrawals for when the price of gas (GWEI) is low.
			</Answer>

			<Question>What info do you save on-chain?</Question>
			<Answer>
				We make sure that the smart contract and metadata associated with your collection are securely stored on the blockchain once it's deployed. As for the images or media, they are initially stored in AWS and transferred to IPFS when the NFTs are minted. In the case of “evolving collections”, we offer a convenient solution to the admins/curators to manage their IPFS costs. They can choose to batch update the IPFS URLs for new items, making it easier for them to move their images from AWS to IPFS in groups and at a time that works best for them. We are also exploring other storage options like Arweave which seems to offer a more permanent form of storage.
			</Answer>

			<Title>Minting</Title>
			<Question></Question>
			<Answer></Answer>

			<Question>What is the difference between self-mint and lazy-mint?</Question>
			<Answer>
				Self-mint NFT and lazy-mint are two different ways of creating and issuing Non-Fungible Tokens (NFTs). Self-mint NFTs are created and minted directly by the owner or creator of the digital asset. This means the owner has full control over the creation process and can create as many NFTs as they want. Lazy-mint NFTs, on the other hand, are created on demand when they are sold or traded. In this case, the NFT is minted only when it is needed and not before. This method of NFT creation is often used when the owner or creator of the digital asset wants to conserve resources, such as storage and computational power, and only create the NFT when it is needed. In summary, self-mint NFTs are created proactively by the owner or creator, while lazy-mint NFTs are created reactively when they are sold or traded. It’s important to note that when you self-mint you pay the gas fee for the mint, when you lazy-mint your collectors pay the gas fee as they mint. Also, when you self mint the items are transferred to your wallet.
			</Answer>

			<Question>Can I use Montage to mint my collection?</Question>
			<Answer>Yes! You can mint a single, a few, or a big batch of NFTs.</Answer>

			<Title>Evolving Collections</Title>
			<Question>What is the difference between a set collection and an evolving collection</Question>
			<Answer>
				The difference between a set collection and an evolving collection lies in their ability to change over time.
				<br />
				A set collection is fixed in nature, meaning that once it has been deployed, no further changes can be made to its items, number of items, or team members/artists.
				<br />
				On the other hand, an evolving collection has the capability to grow and adapt over time. The collection founder has the ability to add new items and artists to the collection and mint them after deployment. This allows the collection to evolve and expand as time goes on, offering new opportunities for growth and creativity.
			</Answer>

			<Question>Can I lock an evolving collection?</Question>
			<Answer>
				Yes, it is possible to lock an evolving collection. If you are the founder of an evolving collection, you have the option to convert it to a set collection using a simple switch in your dashboard. Once this has been done, no one, including you, will be able to add new items to the collection.
			</Answer>

			<Title>Technical questions</Title>
			<Question>Why do you split artists from core-team</Question>
			<Answer>We distinguish between artists and the core team in order to give proper recognition and compensation to the creative individuals who contribute their talent and original works to the collection. Our goal is to ensure that artists are fairly rewarded for their contributions and have a stake in the success of the collection.</Answer>

			<Question>What protocol Montage uses?</Question>
			<Answer>
				We’ve built on the Ethereum ERC721 protocol and will be adding more protocols, blockchains, and layers.
			</Answer>

			<Question>What chain does Montage use?</Question>
			<Answer>We’re built on the Ethereum blockchain with the goal of being multichain, building for interoperability and adding other blockchains and layers.</Answer>

			<Question>Can I use you to buy and sell existing NFTs?</Question>
			<Answer>Yes, you can buy existing NFTs that were minted on the Montage smart contract, as well as existing NFTs if they’ve been wrapped with our contract. Ask us for more or request to have your NFTs/collection wrapped by our contract for more royalty flexibility.</Answer>

			<Question>Can I batch upload?</Question>
			<Answer>
				When you’re in the dashboard, look for ADD BATCH in the left panel under ADD BATCH. We support commonly used image, video and audio formats.
			</Answer>
		</div>
	)
}

function Title({ children }) {
	return (
		<div className="title">
			{children}
		</div>
	)
}

function Question({ children }) {
	return (
		<div className="question">
			{children}
		</div>
	)
}

function Answer({ children }) {
	return (
		<div className="answer">
			{children}
		</div>
	)
}