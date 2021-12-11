import { Button } from "@chakra-ui/button";
import { InfoIcon } from "@chakra-ui/icons";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import { useToast } from "@chakra-ui/react"
import { useConnection } from "@solana/wallet-adapter-react";
import useApp from "../appcontext";


export function MainPage() {

    const [token, setToken] = useState<string>("");
    const toast = useToast();
    const { getEscrowInfo } = useApp();

    function onTokenChange(e: any) {
        setToken(e.target.value);
    }

    function searchButton() {

        try {
            const pkey = new PublicKey(token);
            getEscrowInfo(pkey).then((info) => {
                window.location.href = "/deal/" + token
            }).catch(e => {
                toast({
                    title: "This token is not for sale though our escrow",
                    description: "Double check the address you entered",
                    status: "warning",
                    duration: 5000,
                })
            })
        } catch (e) {
            toast({
                title: "Type in proper solana address",
                status: "warning",
                duration: 2000,
            })
        }
    }

    return <Box p={6} marginTop="110px">
        <Text
            bgGradient="linear(to-l, #7928CA, #FF0080)"
            bgClip="text"
            fontSize="6xl"
            fontWeight="extrabold"
            textAlign="center"
        >
            Find your escrow
        </Text>
        <Box textAlign="center">
            <Input maxW="xl" colorScheme="green" borderColor="green.500" placeholder="8om2MpTdEUg5hW7cfWmuvdmKncXC2CZnQq31e4Cmyofh" onChange={onTokenChange}></Input>
            <Button marginLeft="20px" colorScheme="green" variant="outline" onClick={searchButton}>Search</Button>
        </Box>
        <Box marginTop="20px" textAlign="center">
            <Text><InfoIcon /> Type in nft token address and press search button</Text>
        </Box>
    </Box>
}