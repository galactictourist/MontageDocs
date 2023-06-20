const toggleType = {
	ENVOLVING: 2,
	ARTISTS: 1,
    BATCHES: 6,
    MINT_COLLECTOR: 3
}

const data = [
    {
        header: 'How big is your team?',
        cards: [
            {
                title: 'Solo founder',
                filename: 'self-mint.png',
                content: "I'm a solo founder - I'm amazing!",
                recommend: false,
                selected: true
            },
            {
                title: 'We are a team',
                filename: 'team.png',
                content: "We're a team of incredible individuals",
                recommend: false,
                selected: false
            }
        ]
    },
    {
        header: 'What about Artists?',
        cards: [
            {
                title : "I'm also the artist",
                filename: "also-artist.png",
                content: "I'm also the artist and there are no other artists on the team or contributing to this collection",
                recommend: false,
                selected: true
            },
            {
                title: "A single artist",
                filename: "single-artist.png",
                content: "We have one artist on the team that created all items",
                recommend: false,
                selected: false
            },
            {
                title: "Many artists",
                filename: "many-artists.png",
                content: "We have more than one artist contributing to the team",
                recommend: false,
                selected: false
            }
        ]
    },
    {
        header: 'Will this collection be envolving or set?',
        cards: [
            {
                title: 'Evolving collection',
                filename: 'evolving.png',
                content: "You setup, then deploy contract, then add and mint as many items as you want * you can make it a set one at any stage.",
                recommend: true,
                selected: true
            },
            {
                title : "A set collection",
                filename: "set-collection.png",
                content: "You setup, upload all your items, then deploy contract, then mint, but you can't add more items ever",
                recommend: false,
                selected: false
            }
        ]
    },
    {
        header: 'Do you want it to be minted by collectors or by you?',
        cards:[
            {
                title: "Minted by collectors",
                filename: 'minted-by-collectors.png',
                content: "You schedule a private mint & public mint dates where you can invite your allowlist or the public to mint and get your NFTs",
                recommend: true,
                selected: true
            },
            {
                title: "Self mint",
                filename: "self-mint.png",
                content: "You mint the items yourself and pay the gas fee, and list it for sale on your collection page or other markets.",
                recommend: false,
                selected: false
            }
        ]
        
    },
    {
        header: 'Will all your items have the same minting prices?',
        cards:[
            {
                title: 'Yes, same price',
                filename: 'same-price.png',
                content: "All items will have one price for the private mint and another price for the public mint",
                recommend: true,
                selected: true
            },
            {
                title: "Nope, to each it's own",
                filename: "dynamic-prices.png",
                content: "Each item may have a totally different mint price",
                recommend: false,
                selected: false
            }
        ]
    },
    {
        header: 'WOULD YOU LIKE TO HAVE A REVEAL?',
        cards: [
            {
                title: "Yes, who wouldn't",
                filename: 'with-reveal-surprise.png',
                content: "This will allow you to reaveal to your collectors what they minted in a date of your choosing",
                recommend: true,
                selected: true
            },
            {
                title: "No, I don't like surprises",
                filename: "no-reveal.png",
                content: "your collectors will know what they minted the minute they minted it.",
                recommend: false,
                selected: false
            }
        ]
    },
    {
        header: 'Will you upload your items in batches or one by one?',
        cards:[
            {
                title: "In batches",
                filename : "batches.png",
                content: "i have all my items in one folder, and have everything ready.",
                recommend: false,
                selected: true
            },{
                title: "One by one",
                filename : "one-by-one.png",
                content: "I want to upload it one by oneand addl the details manually to each.",
                recommend: false,
                selected: false
            }
        ]
    }
];

const CARDCONSTANT = {
    DATA: data,
    TOGGLE: toggleType
}

export default CARDCONSTANT;