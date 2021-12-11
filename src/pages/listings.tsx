
import { useMemo, useState } from "react";
import { useConnection, useWallet, WalletNotSelectedError } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { AccountLayout } from "@solana/spl-token";

import { GetNft, Nft as NftType } from "../tools/nft"
import { Nft } from "../components/nft"
import { GetSolBalance } from "../tools/user"
import useApp from "../appcontext"
import BN from "bn.js"

import {
    Badge, Button,
    Grid, useToast
} from "@chakra-ui/react"

import {
    Menu,
    MenuButton,
    MenuList,
    MenuItemOption,
    MenuOptionGroup,
    useDisclosure
} from "@chakra-ui/react"

import { ESCROW_ACCOUNT_DATA_LAYOUT } from "../metadata/escrow";
import { BuyItem } from "../tools/escrowops";
import { ItemGrid } from "../components/itemgrid";

export interface DrawListNftProps {
    balance: number
    nfts: {
        item: NftType,
        escrow: PublicKey,
        price: number
    }[]
}

async function getListings(buyerPk: PublicKey, programId: PublicKey, connection: Connection) {

    const response = {
        balance: 0,
        nfts: []
    } as DrawListNftProps;

    if (buyerPk != null) {

        console.log('buyer pk is not empty')

        let balancev = await GetSolBalance(buyerPk, connection);
        console.log("got a balance ", buyerPk.toBase58(), balancev)

        response['balance'] = balancev;
    }

    // nfts info
    let resp = await connection.getProgramAccounts(programId, {
        filters: [
            // todo fix this. probably add version to escrow account info
            { dataSize: 107+32}
            // todo exclude owned by burrent wallet items
        ]
    });

    {
        let mints = [];

        const escrowInfoMap = {

        } as any;

        for (var idx in resp) {

            const decoded = ESCROW_ACCOUNT_DATA_LAYOUT.decode(resp[idx].account.data)

            const tempToken = new PublicKey(decoded.initializerTempTokenAccountPubkey);

            let resp1 = await connection.getAccountInfo(tempToken);

            const decoded1 = AccountLayout.decode(resp1?.data)
            const mintStr = new PublicKey(decoded1.mint).toBase58()

            mints.push(mintStr);

            escrowInfoMap[mintStr] = {
                escrow: decoded,
                addr: resp[idx].pubkey
            }
        }

        // used 
        const itemsArray = await GetNft(connection, mints)

        // construct items info total
        // todo extend nft info to include listing type and additional 
        // info like price for sell listings

        const nfstArray = [];

        for (var idx00 in itemsArray) {

            const it = itemsArray[idx00];

            let escInfo = escrowInfoMap[it.mint].escrow;

            const priceBN = new BN(escInfo.expectedAmount, 10, "le")

            nfstArray.push({
                item: it,
                escrow: escrowInfoMap[it.mint].addr,
                // round to two digits
                price: Math.round((priceBN.toNumber() / LAMPORTS_PER_SOL) * 100) / 100
            })
        }

        response['nfts'] = nfstArray
    }

    console.log('pk not empty code finished', response)


    return response;
}

export interface BuyButtonProps {
    onClick?: any
    mint: string
    price: number
    escrow: PublicKey
}

function BuyButton(props: BuyButtonProps) {

    const { processEscrow } = useApp();
    const toast = useToast();

    function onClick() {

        const mintPkey = new PublicKey(props.mint);
        const escrowAddr = new PublicKey(props.escrow);

        processEscrow(escrowAddr, mintPkey).then(txsig => {
            toast({
                title: "Listing placed",
                description: "Check tx " + txsig + " on explorer",
                position: "top-right",
                status: "success",
                duration: 5000,
                isClosable: true,
            })
            console.log('transaction confirmed :', txsig)
        }).catch(e => {
            if (e instanceof WalletNotSelectedError) {
                toast({
                    title: "use Select Wallet button before",
                    position: "top-right",
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                })
            } else {
                console.warn(e)
                toast({
                    title: "Failed to buy",
                    description: e.message,
                    position: "top-right",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                })
            }
        });
    }

    return <div className="nftBtnActions">
        <Button onClick={onClick}>Buy for</Button>
        <Button colorScheme="yellow" size="md" float="right">{Math.round(props.price * 100) / 100}◎</Button>
    </div>
}

export function Listings() {

    // sell drawer
    const { isOpen, onOpen, onClose } = useDisclosure()
    // sell end

    const { publicKey } = useWallet();
    const { connection } = useConnection();

    const { appProgramId } = useApp();

    const [info, setInfo] = useState<DrawListNftProps>({
        balance: 0,
        nfts: []
    })

    const _info = useMemo(async () => {
        const resultinfo = await getListings(publicKey as PublicKey, appProgramId, connection)

        console.log('setting result info ', resultinfo)

        setInfo(resultinfo);
    }, [publicKey])

    return (<div>
        <ItemGrid>{info.nfts.map(function (item, idx) {
            return <Nft key={idx} mint={item.item.mint}>
                <BuyButton mint={item.item.mint} price={item.price} escrow={item.escrow} />
            </Nft>
        })}</ItemGrid>
    </div>)
}