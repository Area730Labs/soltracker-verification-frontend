import { CheckCircleIcon } from "@chakra-ui/icons";
import { useToast, Button, Box, toast, Text, Link, List, ListItem, ListIcon } from "@chakra-ui/react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import axios from "axios";

import { v4 as uuidv4 } from 'uuid';

export default function VerifyBot() {

    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { signMessage, signTransaction } = useWallet();
    const toast = useToast();

    function toHexString(byteArray: Uint8Array) {
        return Array.from(byteArray, function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }


    const urlParams = new URLSearchParams(window.location.search);
    const discordTokenValue = urlParams.get('token');

    let discordToken = false;

    if (discordTokenValue != undefined && discordTokenValue != '') {
        discordToken = true;
    } else {
        // discordToken = true;
        window.location.href = "https://api.soltracker.io/verify_user_discord"
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

        if (signMessage != null) {

            signMessage(enc.encode(msg)).then(function (response) {

                const verifyNewUser = {
                    sig_uid: requestUid,
                    sig_hex: toHexString(response),
                    sig_tpl_ver: "1",
                    pubkey: publicKey?.toBase58(),
                    discord_token: discordTokenValue,
                    discord_token_hash: "",//discordTokenValue,
                    timestamp: ts
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
                toast({
                    title: "Message sign request were declined: "+err.message,
                    position: "top-right",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                })
                console.log('failed to sign a message' + err)
            })
        } else {
            if (signTransaction != null) {

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
                    title: "Unable to verify wallet ownership",
                    position: "top-right",
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                })
            }
        }
    }

    if (discordToken) {
        return <Box p={6} marginTop="20px" >
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