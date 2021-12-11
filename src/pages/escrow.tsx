import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { withRouter } from "react-router-dom";
import useApp from "../appcontext"
import { Nft } from "../components/nft";
import { EscrowInfoComposed } from "./escrows";
import { useEffect, useMemo, useState } from "react";
import { NftMinterInfo } from "../tools/escrowops";

import { Alert, AlertIcon, Button, ButtonGroup, Link, Tooltip } from "@chakra-ui/react"
import { toast, useToast } from "@chakra-ui/toast";
import { Box, Grid, GridItem, Text } from "@chakra-ui/layout";
import BN from "bn.js";
import { ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";
import { useWallet } from "@solana/wallet-adapter-react";
import { SolAddress } from "../components/soladdress";

export interface EscrowProps {
    escrowAddress: PublicKey | string
}


function Escrow(props: any) {

    const mintAddres: string = props.match.params.escrow;

    const { getEscrowInfo, getNftMinterInfo, processEscrow } = useApp();
    const { publicKey } = useWallet();
    const [escrow, setEscrow] = useState<EscrowInfoComposed | null>(null);
    const [minterInfo, setMinfo] = useState<NftMinterInfo | null>(null);

    const toast = useToast();

    function processEscrowBtn() {

        processEscrow(escrow?.escrowAddress as PublicKey, escrow?.mint as PublicKey).then((txsig) => {

            function TxSigClick() {
                window.open("https://solscan.io/tx/" + txsig, "_blank")
            }

            toast({
                title: "Successfully bought an NFT",
                description: <Button colorScheme="white" variant="outline" onClick={TxSigClick} leftIcon={<ExternalLinkIcon />}>check tx</Button>,
                position: "top-right",
                status: "success",
                duration: 2000,
                isClosable: true,
            })

            setTimeout(function(){
                window.location.href = "/sell"
            },2000)

        }).catch(e => {

            toast({
                title: e.message,
                position: "top-right",
                status: "warning",
                duration: 5000,
                isClosable: true,
            })
        })

    }

    useEffect(() => {

        getNftMinterInfo(new PublicKey(mintAddres)).then(minfo => {
            setMinfo(minfo);
            console.log('minter info', minfo)
        })

        getEscrowInfo(new PublicKey(mintAddres)).then(info => {
            setEscrow(info)
        }).catch(e => {
            toast({
                title: "Unable to get escrow info",
                description: "Probably this item is not in escrow. Double check the link or contact a person who created this escrow",
                status: "info",
                duration: 5000,
                isClosable: true,
            })
        })
    }, [])


    const priceSol = new BN(escrow?.escrow.expectedAmount, 10, "le").toNumber() * 1 / LAMPORTS_PER_SOL;
    const mintPrice = 1 / LAMPORTS_PER_SOL * (minterInfo?.mintPayment.value as number);


    let buyerPubkey: PublicKey | undefined = undefined;
    let dealAllowed = false;

    let disallowCause = "Connect wallet to check if you can process this escrow"

    let ownEscrow = false;

    if (escrow != null || escrow != undefined) {
        const sellerPubKey = new PublicKey(escrow?.escrow.sellerPubkey)
        if (publicKey == undefined || publicKey == null) {
            dealAllowed = false;
        } else {
            try {
                const privateSell: boolean = escrow.escrow.isPrivateSale

                if (privateSell) {

                    buyerPubkey = new PublicKey(escrow?.escrow.buyerPubkey);

                    if (!buyerPubkey.equals(publicKey)) {

                        if (sellerPubKey.equals(publicKey)) {
                            dealAllowed = false;
                            disallowCause = "You can't process your own escrow"
                            ownEscrow = true;
                        } else {
                            dealAllowed = false;
                            disallowCause = "Your wallet is not the one mentioned as buyer"
                        }
                    } else {
                        dealAllowed = true;
                    }
                } else {
                    if (sellerPubKey.equals(publicKey)) {
                        dealAllowed = false;
                        disallowCause = "You can't process your own escrow"
                        ownEscrow = true;
                    } else {
                        dealAllowed = true
                    }
                }
            } catch (e) {
                console.warn('gotcha error', e)
            }
        }
    } else {
        console.log('escrow is zero')
    }

    const mintAddrStr: string | undefined = escrow?.mint.toBase58();
    const sellerPub: string | undefined = escrow != null ? new PublicKey(escrow?.escrow.sellerPubkey).toBase58() : undefined;

    const colorScheme = "green"

    const mintType = minterInfo?.mintPayment.type == "sol"? "candy machine sale":(minterInfo?.mintPayment.type == "minttoken"?"fair mint":"unknown");

    return <div>
        <Box marginTop="10px" >
            <Grid templateColumns="repeat(5, 1fr)" gap={2} >
                <GridItem colSpan={2} overflow="hidden">
                    {escrow != null ? (
                        <Nft width={320} mint={mintAddrStr as string} />
                    ) : null}
                    <Box marginTop="15px" marginRight="50px" textAlign="justify">
                        <Text fontSize="sm" lineHeight="1.5rem"> <InfoIcon /> Youre the one responsible for what you're buying. Check the verifyed state on other markets before buying </Text>
                    </Box>
                </GridItem>
                <GridItem colSpan={2} overflow="hidden">
                    <Infoblock text="SELL PRICE" fontSize="2xl" marginTop={0}>
                        {/* <Text fontSize="5xl" fontWeight="700" lineHeigh="2.25rem" marginBottom="1.6rem">◎ {priceSol}</Text> */}
                        <Box marginTop="20px">
                        <Button onClick={processEscrowBtn} disabled={!dealAllowed} colorScheme={colorScheme} size="lg" width="100%">Buy for {priceSol} SOL</Button>
                        </Box>
                        {mintPrice == 0 && minterInfo?.mintPayment.type == "sol" ? (<Box marginTop="20px"> <Alert status="warning">
                            <AlertIcon />
                            NFT were minted for 0 SOL. Double check if its not a scam. On average mint price is around 1-2 SOL
                        </Alert> </Box>) : null}
                        {!dealAllowed ? (<Box marginTop="20px"> <Alert status="info" fontSize="sm" borderRadius="8px">
                            <AlertIcon /> {disallowCause}
                        </Alert> </Box>) : null}
                    </Infoblock>
                    <Infoblock text="NFT MINTED">
                        <Text>by  <SolAddress address={minterInfo?.minter}/> at {minterInfo?.createdTime}
                        using candy machine  <SolAddress address={minterInfo?.candyMachine}/></Text>
                    </Infoblock>
                    <Infoblock text="CHECK VERIFY STATUS ON">
                        <Text display="inline" marginTop="20px">
                            <Link target="_blank" href={"https://digitaleyes.market/item/" + mintAddrStr}>
                                <Button variant="outline" colorScheme={colorScheme}>
                                    DigitalEyes
                                </Button>
                            </Link>
                        </Text>
                        <Text display="inline-block" marginLeft="10px" marginTop="20px"><Link target="_blank" href={"https://magiceden.io/item-details/" + mintAddrStr}>
                            <Button variant="outline" colorScheme={colorScheme}>
                                MagicEden
                                </Button></Link></Text>
                        <Text display="inline-block" marginLeft="10px" marginTop="20px"><Link target="_blank" href={"https://alpha.art/t/" + mintAddrStr}>
                            <Button variant="outline" colorScheme={colorScheme}>
                                AlphaArt
                                </Button></Link></Text>
                    </Infoblock>
                </GridItem>
                <GridItem colSpan={1} overflow="hidden" textAlign="right">

                    <Infoblock text="NFT" textAlign="left" marginTop="0">
                        <SolAddress address={mintAddrStr}/>
                    </Infoblock>

                    <Infoblock text="SELLER">
                         <SolAddress address={sellerPub}/>
                    </Infoblock>

                    <Infoblock text="MINT TYPE">
                        {mintType}
                    </Infoblock>
                    {minterInfo?.mintPayment.type == "sol" ?
                        <Infoblock text="MINT PRICE">
                            ◎ {mintPrice}
                        </Infoblock> : null
                    }

                </GridItem>
            </Grid>
        </Box>
    </div>
}


export function Infoblock(props: any) {

    const fontSize = props.fontSize ?? "xl"
    const marginTop = props.marginTop ?? "20px"

    const child = props.children as JSX.Element | JSX.Element[] | null

    return <Box marginTop={marginTop}>
        <Text fontSize={fontSize} fontWeight="lighter">{props.text}</Text>
        {child}
    </Box>
}

export default withRouter(Escrow);

