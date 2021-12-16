import { BrowserRouter } from "react-router-dom";
import { chakra, ChakraProvider, Container, useToast } from "@chakra-ui/react"
import { AppProvider } from "./appcontext"
import { useMemo } from "react";

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  getPhantomWallet,
  getSolflareWallet,
  getLedgerWallet,
  getSolletWallet,
 
} from '@solana/wallet-adapter-wallets';

import { AppRouter } from './router';
import { clusterApiUrl } from "@solana/web3.js"
import { NetworkToUse } from '.';

// Default styles that can be overridden by your app
import './App.css';
require('@solana/wallet-adapter-react-ui/styles.css');

function App() {

  const endpoint = clusterApiUrl(NetworkToUse)

  const wallets = useMemo(() => [
    getPhantomWallet(),
    getSolflareWallet(),
    getLedgerWallet(),
    getSolletWallet({ NetworkToUse }),
  ], [NetworkToUse]);

  return <ChakraProvider >
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <AppProvider>
          <BrowserRouter>
            <Container className="App" maxW='container.sm' minH="80%">
              <AppRouter />
            </Container>
          </BrowserRouter>
        </AppProvider>
      </WalletProvider>
    </ConnectionProvider>
  </ChakraProvider >
}

export default App;
