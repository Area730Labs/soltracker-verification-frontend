
import { useMemo, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from "@solana/web3.js"
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { GetNft } from "./tools/nft"
import { Nft } from "./components/nft"
import useApp from "./appcontext"
import { SellForm } from "./components/sellform"
import { SellMint } from "./tools/escrowops"

import {
    Button,
    Grid, GridItem, useToast,
    Box,
    Text
} from "@chakra-ui/react"
import {
    useDisclosure
} from "@chakra-ui/react"

import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from "@chakra-ui/react"
import { ItemGrid } from "./components/itemgrid";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { SolAddress } from "./components/soladdress";

async function calcBalanceAndNfts(publicKey, connection) {

    const response = {
        balance: 0,
        nfts: []
    };

    console.log("goint to get a balance", publicKey, "changed")

    if (publicKey != null) {

        // let balancev = await GetSolBalance(publicKey, connection);
        // console.log("got a balance ", publicKey.toBase58(), balancev)

        // response['balance'] = balancev;

        // nfts info

        let resp = await connection.getTokenAccountsByOwner(publicKey, {
            programId: TOKEN_PROGRAM_ID,
        });

        {
            console.log('got a token accounts by owner', resp.value.length)

            let mints = [];
            for (var idx in resp.value) {

                const decoded = AccountLayout.decode(resp.value[idx].account.data)

                const amnt = decoded.amount.readIntLE();
                if (amnt === 1) {
                    const mAddr = new PublicKey(decoded.mint).toBase58();

                    // todo update in local storage
                    let newItem = {
                        associated: decoded,
                        mintAddress: mAddr,
                        amount: amnt
                    }
                    mints.push(mAddr);
                }
            }

            const itemsArray = await GetNft(connection, mints)
            response['nfts'] = itemsArray
        }

        console.log('pk not empty code finished', response)
    }

    return response;
}

function SellDrawer(props) {

    const isOpen = props.isOpen
    const onClose = props.onClose

    const { mintSelected, appProgramId, appTreasury } = useApp()
    const [youget, setYouget] = useState(0)
    const { sellForm } = useApp();
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const toast = useToast();

    function priceNotifier(newPriceVal) {
        setYouget(newPriceVal)
    }

    function handleSubmit() {

        if (sellForm.buyersAddress == undefined || sellForm.buyersAddress == null || sellForm.buyersAddress == "") {
            toast({
                title: "Buyer's wallet should be filled in",
                status: "error",
                position: "top-right",
                duration: 2000,
                isClosable: true,
            })
        } else {

            SellMint(publicKey, connection,
                appProgramId,
                sellForm)
                .then(async (txinfo) => {

                    return sendTransaction(txinfo.transaction, connection, {
                        signers: txinfo.signers
                    })

                }).then(txsig => {

                    function TxSigClick() {
                        window.open("https://solscan.io/tx/" + txsig, "_blank")
                    }

                    toast({
                        title: "Listing placed",
                        description: <Button colorScheme="white" variant="outline" onClick={TxSigClick} leftIcon={<ExternalLinkIcon />}>check tx</Button>,
                        status: "success",
                        duration: 5000,
                        isClosable: true,
                    })

                    onClose();

                }).catch(e => {
                    toast({
                        title: "Failed to sell",
                        description: e.message,
                        status: "error",
                        position: "top-right",
                        duration: 3000,
                        isClosable: true,
                    })
                });
        }
    }

    return (
        <Drawer
            isOpen={isOpen}
            placement="right"
            onClose={onClose}
            size="md"
        // finalFocusRef={btnRef}
        >
            <DrawerOverlay />
            <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Sell <SolAddress address={mintSelected} short={8} /></DrawerHeader>
                <DrawerBody>
                    <Grid templateColumns="repeat(5, 1fr)" >
                        <GridItem colSpan={2}>
                            <Nft width={172} mint={mintSelected} />
                            <div className="youdGetBig">
                                <Text fontWeight="lighter">YOU'D GET</Text>
                                <Text className="youGetBlock" fontWeight="lighter">◎ {youget}</Text>
                            </div>
                        </GridItem>
                        <GridItem colSpan={3}>
                            {isOpen ? (<SellForm mint={mintSelected} youGetNotifier={priceNotifier} />) : null}
                        </GridItem>
                    </Grid>
                </DrawerBody>

                <DrawerFooter>
                    <Button variant="outline" mr={3} onClick={onClose}>
                        Cancel
                        </Button>
                    <Button colorScheme="green" onClick={handleSubmit}>Sell</Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}


function SellButton(props) {

    const { setMintSelected } = useApp();

    function onClick() {
        setMintSelected(props.mint)

        if (props.onSellBtn != undefined) {
            props.onSellBtn();
        }
    }
    return (
        <Button width="100%" variant="outline" colorScheme="green" onClick={onClick}>Sell</Button>
    )
}

export const Balance = () => {

    // sell drawer
    const { isOpen, onOpen, onClose } = useDisclosure()
    // sell end

    const { publicKey } = useWallet();
    const { connection } = useConnection();

    const [info, setInfo] = useState({
        balance: 0,
        nfts: []
    })

    const _info = useMemo(async () => {
        const resultinfo = await calcBalanceAndNfts(publicKey, connection)
        setInfo(resultinfo);
    }, [publicKey])

    return (<div>
        <ItemGrid>
            {info.nfts.map(function (item, idx) {
                return <Nft key={idx} mint={item.mint}  >
                    <Box marginTop="10px">
                        <SellButton variant="outline" mint={item.mint} onSellBtn={onOpen} />
                    </Box>
                </Nft>
            })}
        </ItemGrid>
        <SellDrawer isOpen={isOpen} onClose={onClose} />
    </div>)
}