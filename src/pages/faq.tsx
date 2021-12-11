import { Box, Button, Link, Text,useColorMode,ColorMode } from "@chakra-ui/react";

function Question(props: any) {
    return <Box marginTop="20px">
        <Text textTransform="uppercase" fontSize="3xl"   bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text">{props.q}</Text>
        <Text marginTop="" fontSize="2xl" fontWeight="lighter">{props.children}</Text>
    </Box>
}

export default function FaqPage() {

    const { toggleColorMode } = useColorMode()

    return <Box>
        <Box >
            <Question q="Do you have a dark theme?">
                You bet we do! <Button onClick={toggleColorMode} colorScheme="green" variant="outline">Check it out</Button>
            </Question>

            <Question q="Can I cancel my escrow listing?">
                Yes.
            </Question>

            <Question q="What if i made a mistake in buyer's wallet?">
                Cancel an escrow, its free. And then create a new one
            </Question>

            <Question q="How to sell an NFT with your service?">
                push the Create escrow button on top, choose the NFT you want to sell to someone. Fill in the sell form, including price and buyers wallet. Press sell button. Give counterparty a link to escrow (you can get it in `active escrows` page) or an nft token address. Then wait when the counterparty pays for your NFT 
            </Question>

            <Question q="Can I have multiple escrows at once?">
                <p>Yes. To see all your listings, go to <Link href="/my" target="_blank"><Button variant="outline" colorScheme="green">Active escrows</Button></Link></p>
            </Question>

            <Question q="Do I pay a royalty when I buy through escrow?">
                <p>No. Escrow is not a market. Thus you must enter the buyer's wallet when you create a listing. Escrow is a peer-to-peer sale. You don't pay royalties when you exchange NFT with your friend or gift it to your foe, right?</p>
            </Question>

            <Question q="Can I make an escrow listing without the buyer's wallet?">
                <p>No. This is a STRICTLY peer-to-peer sale.</p>
            </Question>

             <Question q="Can someone (even you) steal my NFT or revenue?">
                <p>No. The sale is fully automated through a smart contract on Solana blockchain. </p>
            </Question>

             <Question q="Can I change the price of my listing?">
                <p>Currently no. We will add this feature soon. For now, you have to unlist your NFT and create a new listing with an updated price. </p>
            </Question>

             <Question q="How to make sure I don't buy a fake?">
                <p>You must make sure that the NFT is verified on one of the markets (we have links to popular markets on the listing page for convenience). If the NFT is authentic, it must have a Verified badge on at least ONE of the markets. !! NOTE: Only a few collections are verified on all markets. The vast majority of NFTs are verified ONLY on one market. This is enough to be 100% sure that NFT is authentic. </p>
            </Question>

             <Question q="I got scammed. Can I get a refund?">
                <p>No. The only way you can get scammed is if you don't follow the instructions above. </p>
            </Question>

             <Question q="How does it work?">
                <p>When you sell your NFT, it is locked in the smart contract on the Solana blockchain. Only have access to it. You can unlist it any time you like.
When you buy NFT, your money is also locked in the same smart contract. When the payment is received, the contract automatically gives the seller the money, and the buyer gets hit NFT. </p>
            </Question>

             <Question q="Do you store any information on your servers?">
                <p>No, all data is stored solely on the Solana blockchain.</p>
            </Question>





        </Box>

    </Box>
}