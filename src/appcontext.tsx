import React, {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { EscrowInfoComposed } from "./pages/escrows";

import {
    BuyItem, CancelEscrow,
    getEscrowInfo as getEscrowInfoImpl,
    getUsersEscrows as getUsersEscrowsImpl,
    getNftMinterInfo as getNftMinterInfoImpl,
    NftMinterInfo
} from "./tools/escrowops"

export interface SellFormType {
    price: number
    mint: PublicKey // useless. already in app context,

    is_private_sell: boolean,
    buyersAddress?: PublicKey,

    payroyalties: boolean
}
interface EscrowInfoGetter {
    (escrowAddr: PublicKey): Promise<EscrowInfoComposed>;
};

interface EscrowCancelFunc {
    (escrowAddr: PublicKey, mint: PublicKey): Promise<string>;
}

interface GetEscrowsFunc {
    (): Promise<EscrowInfoComposed[]>;
}

interface ProcessEscrowFunc {
    (escrowAddress: PublicKey, mintToReceive: PublicKey): Promise<string>
}
interface NftMinterInfoFunc {
    (mint: PublicKey): Promise<NftMinterInfo>
}

interface AppContextType {
    network?: WalletAdapterNetwork,

    // front config
    cols: number,
    setCols: any,
    nftWidth: number,


    // sell options
    setMintSelected?: any

    // propgrams
    appProgramId: PublicKey
    setAppProgramId: any,

    appTreasury: PublicKey
    escrowFeeBasisPoints: number

    sellForm?: SellFormType

    // wallet info
    pubkey?: PublicKey

    // methods
    setSellForm: any
    getEscrowInfo: EscrowInfoGetter
    cancelEscrow: EscrowCancelFunc
    getUsersEscrows: GetEscrowsFunc
    processEscrow: ProcessEscrowFunc
    getNftMinterInfo: NftMinterInfoFunc
}

const AppContext = createContext({} as AppContextType);
let AppContextConfig = {} as AppContextType;

export function setupAppContext(net: WalletAdapterNetwork, columns: number, appProgram: PublicKey, appTreasury: PublicKey, feePoints: number) {

    AppContextConfig = {
        network: net,
        cols: columns,
        appProgramId: appProgram,
        appTreasury: appTreasury,
        escrowFeeBasisPoints: feePoints
    } as AppContextType;
}

export function AppProvider({ children }: {
    children: ReactNode;
}): JSX.Element {

    const { connection } = useConnection();
    const [network, _setNetwork] = useState<WalletAdapterNetwork>(AppContextConfig.network as WalletAdapterNetwork);
    const [cols, setCols] = useState<number>(AppContextConfig.cols);
    const [mintSelected, setMintSelected] = useState<string>("")

    const [appProgramId, setAppProgramId] = useState<PublicKey>(AppContextConfig.appProgramId);
    const [sellForm, setSellForm] = useState<SellFormType>({} as SellFormType);

    const [appTreasury, _setTreasury] = useState<PublicKey>(AppContextConfig.appTreasury);
    const [escrowFeeBasisPoints, _setSscrowFeeBasisPoints] = useState<number>(AppContextConfig.escrowFeeBasisPoints)

    const { publicKey, sendTransaction } = useWallet();

    const getEscrowInfo = function (mint: PublicKey): Promise<EscrowInfoComposed> {
        return getEscrowInfoImpl(appProgramId, connection, mint);
    }

    const cancelEscrow = function (escrowAddr: PublicKey, mint: PublicKey): Promise<string> {

        if (publicKey == null) {
            return Promise.reject(new Error("Unable to cancel. connect your wallet first"))
        }

        return CancelEscrow(publicKey, connection, appProgramId, escrowAddr, mint).then(txinfo => {
            return sendTransaction(txinfo.transaction, connection, {
                signers: txinfo.signers
            });
        });
    }

    const getUsersEscrows = function () {

        if (publicKey == null) {
            return Promise.reject("No wallet connected. connect to perform request")
        }

        return getUsersEscrowsImpl(connection, appProgramId, publicKey);
    }

    const processEscrow = function (escrowAddress: PublicKey, mintToReceive: PublicKey): Promise<string> {

        if (publicKey == null) {
            return Promise.reject("No wallet connected. connect to perform request")
        }

        return BuyItem(publicKey, connection, appProgramId, appTreasury, escrowAddress, mintToReceive)
            .then(async (txinfo) => {

                return sendTransaction(txinfo.transaction, connection, {
                    signers: txinfo.signers
                })

            });
    }


    const getNftMinterInfo = function (mint: PublicKey): Promise<NftMinterInfo> {
        return getNftMinterInfoImpl(connection, mint);
    }


    const memoedValue = useMemo(() => {

        const nftWidth = Math.round(870 / cols);

        return {
            network,
            cols,
            nftWidth,
            setCols,
            setMintSelected,
            mintSelected,
            appProgramId,
            setAppProgramId,
            sellForm,

            publicKey,
            setSellForm,

            appTreasury,
            escrowFeeBasisPoints,
            getEscrowInfo,
            cancelEscrow,
            getUsersEscrows,
            processEscrow,
            getNftMinterInfo,


        }

    }, [network, cols, mintSelected, sellForm, appProgramId,
        appTreasury, escrowFeeBasisPoints,
        publicKey
    ]);

    return (
        <AppContext.Provider value={memoedValue}>
            {children}
        </AppContext.Provider>
    );
}

export default function useApp() {
    return useContext(AppContext);
}