import { useWallet } from "@solana/wallet-adapter-react";
import {
    Switch,
    Route,
    Redirect,
} from "react-router-dom";

import { Balance } from "./userwallet"
import Sell from "./pages/sell";
import { Listings } from "./pages/listings";
import { Button, useColorMode, Badge, Box, Input, Link } from "@chakra-ui/react"

import {
    WalletModalProvider,
    WalletMultiButton,
    WalletConnectButton
} from '@solana/wallet-adapter-react-ui';
import Escrows from "./pages/escrows";
import Escrow from "./pages/escrow";
import FaqPage from "./pages/faq"

import { PageWithHeader } from "./components/PageWithHeader"

import {
    HamburgerIcon,
    LockIcon,
    RepeatIcon
} from "@chakra-ui/icons"

import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Portal,
    IconButton,
    MenuDivider,
    ColorMode
} from "@chakra-ui/react"
import { MainPage } from "./pages/main";
import { ItemGrid } from "./components/itemgrid";
import VerifyBot from "./pages/verifybot";

export function AppRouter() {

    const { disconnecting } = useWallet();
    const { colorMode, toggleColorMode } = useColorMode()


    return (
        <div>
            <header className="menuLine">
                <Menu>
                    <Portal>
                        <MenuList>
                            <MenuItem><a href="/my">Active escrows</a></MenuItem>
                            <MenuItem><a href="/sell">Sell NFT</a></MenuItem>
                            <MenuDivider />
                            <MenuItem><a onClick={toggleColorMode}>{(colorMode == "dark" as ColorMode) ? "Light" : "Dark"} theme</a></MenuItem>
                        </MenuList>
                    </Portal>
                  
                </Menu>
                <Box marginLeft="10px" display="inline-block">
                    <Link href="/">
                        <b>NFT <LockIcon /> veryfication bot </b>
                    </Link>
                    by <a href="https://soltracker.io">soltracker.io</a>
                </Box>
            </header>
            <VerifyBot/>
        </div>
    )
}

function AuthenticatedRoute({ ...props }) {

    const { publicKey } = useWallet();

    if (!publicKey) {
        return <Redirect to="/" from={props.path} />;
    }

    return <Route {...props} />;
}