import { Transaction, Signer } from "@solana/web3.js"

export interface TxGenResponse {
    transaction: Transaction
    signers: Signer[],
}