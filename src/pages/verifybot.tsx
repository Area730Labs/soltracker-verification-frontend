import { CheckCircleIcon } from "@chakra-ui/icons";
import { useToast, Button, Box, toast, Text, Link, List, ListItem, ListIcon } from "@chakra-ui/react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import axios from "axios";
import {useState} from "react";


import { v4 as uuidv4 } from 'uuid';

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
} from '@chakra-ui/react'

import { useDisclosure } from '@chakra-ui/react'
import { useEffect } from "react";

export default function VerifyBot() {

    // ledger stuff
    const { isOpen, onOpen, onClose } = useDisclosure()

    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { signMessage, signTransaction } = useWallet();
    const toast = useToast();

    const [tries,setTries] = useState(0);


    function toHexString(byteArray: Uint8Array) {
        return Array.from(byteArray, function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    const urlParams = new URLSearchParams(window.location.search);
    const discordTokenValue = urlParams.get('token');
    const collection_id = urlParams.get('collection');

    let discordToken = false;

    if (discordTokenValue != undefined && discordTokenValue != '') {
        discordToken = true;
    } else {
        // discordToken = true;
        window.location.href = "https://api.soltracker.io/verify_user_discord"
    }

    function showDeclinedAlert() {
        toast({
            title: "Message sign request were declined",
            position: "top-right",
            status: "warning",
            duration: 5000,
            isClosable: true,
        })
    }

    function verifyBot() {

        var enc = new TextEncoder();

        const requestUid = uuidv4();

        const ts = Math.floor((new Date()).getTime() / 1000)

        const msg = `Sign this message to grant\n\n server DAO specific features.\n\n Sign request id:\n ${requestUid}\n\nTimestamp: \n${ts}`;

        if (publicKey == undefined) {
            toast({
                title: "Wallet is not connected",
                position: "top-right",
                status: "info",
                duration: 5000,
                isClosable: true,
            })
            return
        }

        if (signMessage != null && typeof signMessage != "undefined" && tries == 0) {

            setTries(tries+1);

            signMessage(enc.encode(msg)).then(function (response) {

                const verifyNewUser = {
                    sig_uid: requestUid,
                    sig_hex: toHexString(response),
                    sig_tpl_ver: "1",
                    pubkey: publicKey?.toBase58(),
                    discord_token: discordTokenValue,
                    discord_token_hash: "",
                    timestamp: ts,
                    collection_id : collection_id,
                }

                axios.post('https://sol.catchmetech.com/verify/new', verifyNewUser).then((response) => {
                    console.log('got an api response', response)

                    toast({
                        title: "Shortly you'll get discord roles",
                        position: "top-right",
                        status: "success",
                        duration: 5000,
                        isClosable: true,
                    })

                }).catch((e) => {

                    toast({
                        title: "Error verifying: " + e.response.data.msg,
                        position: "top-right",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    })
                })
            }).catch(function (err) {
                onOpen();
            })
        } else {
            if (signTransaction != null) {
                signTransactionMethod();
            } else {
                toast({
                    title: "Unable to verify wallet ownership",
                    position: "top-right",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                })
            }
        }
    }

    function signTransactionMethod() {
        if (signTransaction != null && publicKey != null) {

            const ts = Math.floor((new Date()).getTime() / 1000)

            connection.getRecentBlockhash('finalized').then(resp => {
                const transaction = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey as PublicKey,
                        toPubkey: publicKey as PublicKey,
                        lamports: 100,
                    })
                );

                transaction.feePayer = publicKey as PublicKey

                transaction.recentBlockhash = resp.blockhash
                const serializedTx = transaction.serializeMessage()

                signTransaction(transaction).then(function (signedTx) {

                    const verifyNewUser = {
                        sig_uid: toHexString(serializedTx),
                        sig_hex: toHexString(signedTx.signatures[0].signature as Buffer),
                        sig_tpl_ver: "ledger_tx",
                        pubkey: publicKey.toBase58(),
                        discord_token: discordTokenValue,
                        discord_token_hash: "",
                        timestamp: ts
                    }

                    axios.post('https://sol.catchmetech.com/verify/new', verifyNewUser).then((response) => {

                        toast({
                            title: "Shortly you'll get discord roles",
                            position: "top-right",
                            status: "success",
                            duration: 5000,
                            isClosable: true,
                        })

                    }).catch((e) => {

                        toast({
                            title: "Error verifying: " + e.response.data.msg,
                            position: "top-right",
                            status: "error",
                            duration: 5000,
                            isClosable: true,
                        })
                    })

                }).catch(e => {
                    toast({
                        title: "Unable to confirm wallet ownership: "+e.message,
                        position: "top-right",
                        status: "warning",
                        duration: 5000,
                        isClosable: true,
                    })
                });
            }).catch(e => {
                toast({
                    title: "Solana network error. try again later",
                    position: "top-right",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                })
            });
        } else {
            toast({
                title: "Something got wrong. Contact support",
                position: "top-right",
                status: "warning",
                duration: 5000,
                isClosable: true,
            })
        }
    }

    function usingLedger() {
        onClose();
        signTransactionMethod();
    }

    function notUsingLedger() {
        onClose();
        showDeclinedAlert();
    }

    if (discordToken) {
        return <Box p={6} marginTop="20px" >

            <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Ooops. Do you use ledger bound wallet?</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Text fontSize="m">In that case we ask you to sign transaction to confirm you own a wallet by pressing the green button below.</Text>
                        {/* <Text fontSize="xs">Transaction sends a small ammount of sol from your wallet to your wallet</Text> */}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme='green' mr={3} onClick={usingLedger}>
                            Yes, i'm using ledger
                        </Button>
                        <Button onClick={notUsingLedger}>No</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Text
                bgGradient="linear(to-l, #7928CA, #FF0080)"
                bgClip="text"
                fontSize="2xl"
                fontWeight="extrabold"
                textAlign="center"
            >Follow next steps</Text>
            <Text
                bgGradient="linear(to-l, #7928CA, #FF0080)"
                bgClip="text"
                fontSize="xl"
                fontWeight="extrabold"
                marginBottom="20px;"
                textAlign="center"
            >to get verified</Text>

            <List spacing={3} fontWeight="bold">
                <ListItem>
                    <span>1.</span>
                    {/* <ListIcon as={CheckCircleIcon} color='green.500' /> */}
                    <span style={{ marginLeft: "10px" }}> Connect a wallet with a button below:
                    </span>
                </ListItem>
                <ListItem textAlign="center">
                    <WalletModalProvider>
                        <WalletMultiButton className="walletBtn" />
                    </WalletModalProvider>
                </ListItem>
                <ListItem>
                    {/* <ListIcon as={CheckCircleIcon} color='green.500' /> */}
                    <span>2.</span>
                    <span style={{ marginLeft: "10px" }}> Verify ownership of a wallet by pressing and signing a message with button below:</span>
                </ListItem>
                <ListItem textAlign="center">
                    {tries>0? <Text fontSize='xs' color="red" >Unable to verify? Press Verify button again for alternative way</Text>:null}
                    <Button onClick={verifyBot} size="lg" bgGradient="linear(to-l, #7928CA, #FF0080)" color="white">Verify</Button>
                </ListItem>
                <ListItem>
                    {/* <ListIcon as={CheckCircleIcon} color='green.500' /> */}
                    <span>3.</span>
                    <span style={{ marginLeft: "10px" }}> Go to discord and check out your verified nft owner roles</span>
                </ListItem>
            </List>

        </Box>;
    } else {
        return (
            <Box p={6} marginTop="110px">
                <Text
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontSize="2xl"
                    fontWeight="extrabold"
                    textAlign="center"
                >Discord not verified.</Text>
                <Text
                    bgGradient="linear(to-l, #7928CA, #FF0080)"
                    bgClip="text"
                    fontSize="xl"
                    fontWeight="extrabold"
                    textAlign="center"
                >Go back to discord server and recheck a link</Text>
            </Box>
        )
    }
}