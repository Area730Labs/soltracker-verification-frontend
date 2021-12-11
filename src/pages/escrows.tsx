import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons"
import { useToast, Button, Box, toast, Text, Link } from "@chakra-ui/react"
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import useApp from "../appcontext"
import { ItemGrid } from "../components/itemgrid";
import { Nft } from "../components/nft"
import BN from "bn.js"
import { shortenAddr, solscanAccountLink } from "../tools/nft";
import { CopyToClipboard } from 'react-copy-to-clipboard';

export interface CancelListingOpts {
    escrow: EscrowInfoComposed,
    canceledCb?: any
}

export interface EscrowInfoComposed {
    mint: PublicKey
    escrow: any,
    escrowAddress: PublicKey
}

function OwnListingsOpts(props: CancelListingOpts) {

    const { cancelEscrow } = useApp();
    const toast = useToast();

    function onClick() {

        cancelEscrow(props.escrow.escrowAddress, props.escrow.mint).then(txsig => {

            function TxSigClick() {
                window.open("https://solscan.io/tx/" + txsig, "_blank")
            }

            toast({
                title: "Escrow canceled. Your nft is back in your wallet",
                description: <Button colorScheme="white" variant="outline" onClick={TxSigClick} leftIcon={<ExternalLinkIcon />}>check tx</Button>,
                status: "success",
                duration: 5000,
                isClosable: true,
            })

            if (props.canceledCb != undefined) {
                try {
                    props.canceledCb()
                } catch (e0) {
                    window.location.reload()
                }
            }

        }).catch(e => {
            toast({
                title: e.message,
                status: "warning",
                duration: 5000,
                isClosable: true,
            })
        })
    }

    const link = "https://escrow.soltracker.io/deal/" + props.escrow.mint

    function copyLink() {
        toast({
            title: "Link copied. give it to counterparty",
            status: "success",
            duration: 2500,
        })
    }

    const priceSol = new BN(props.escrow?.escrow.expectedAmount, 10, "le").toNumber() * 1 / LAMPORTS_PER_SOL;
    const buyerAddr = new PublicKey(props.escrow.escrow.buyerPubkey).toBase58();

    return <div>
        <Text fontWeight="lighter" fontSize="2xl" textAlign="right">◎ {priceSol}</Text>
        <Box marginTop="5px">
            <Button display="inline" colorScheme="red" variant="outline" onClick={onClick} fontSize="sm" marginRight="8px">Cancel</Button>
            <CopyToClipboard text={link}>
                <Button display="inline" colorScheme="green" onClick={copyLink} fontSize="sm"><CopyIcon marginRight="5px" />Link</Button>
            </CopyToClipboard>
        </Box>
        <Box marginTop="5px">
            <Button width="100%" variant="outline" colorScheme="green" onClick={() => { window.location.href = "/deal/" + props.escrow.mint.toBase58() }}>Preview</Button>
        </Box>
        <Text fontWeight="lighter" textAlign="center">Buyer <Link href={solscanAccountLink(buyerAddr)} >{shortenAddr(buyerAddr)}</Link></Text>
    </div>
}

export default function Escrows() {

    const { getUsersEscrows } = useApp();
    const { publicKey } = useWallet();
    const [items, setItems] = useState<EscrowInfoComposed[]>([]);
    const toast = useToast();

    const [errinterval, setErrInterval] = useState<NodeJS.Timeout>();

    const [um, umUpdate] = useState<number>(0);

    function reloadEscrows() {
        setTimeout(function () {
            umUpdate(um + 1);
        }, 3000)
    }

    useEffect(() => {

        getUsersEscrows().then((itms) => {
            setItems(itms)
            if (errinterval != null) {
                clearTimeout(errinterval);
            }
        }).catch(e => {
            setErrInterval(setTimeout(function () {
                if (publicKey == null) {
                    toast({
                        title: "Connect wallet to see your deals",
                        status: "info",
                        duration: 5000,
                        isClosable: true,
                    })
                }
            }, 1500))
        });
    }, [publicKey, um]);

    if (items.length > 0) {
        return <ItemGrid>
            {items.map((el, idx) => {
                return <Nft key={idx} mint={el.mint.toBase58()}>
                    <OwnListingsOpts escrow={el} canceledCb={reloadEscrows} />
                </Nft>
            })}
        </ItemGrid>
    } else {
        return <Box p={6} marginTop="110px">
            <Text
                bgGradient="linear(to-l, #7928CA, #FF0080)"
                bgClip="text"
                fontSize="6xl"
                fontWeight="extrabold"
                textAlign="center"
            >
                No active escrow
        </Text>
            <Text
                bgGradient="linear(to-l, #7928CA, #FF0080)"
                bgClip="text"
                fontSize="2xl"
                fontWeight="extrabold"
                textAlign="center"
            >
                dont waste your time, <Link href="/sell"><Button variant="outline" colorScheme="green">Sell</Button></Link> something
        </Text>
        </Box>;
    }
}