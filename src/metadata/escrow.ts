//@ts-expect-error missing types
import * as BufferLayout from "buffer-layout";

/**
 * Layout for a public key
 */
const publicKey = (property = "publicKey") => {
    return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
const uint64 = (property = "uint64") => {
    return BufferLayout.blob(8, property);
};


const uint8 = (property = "uint8") => {
    return BufferLayout.blob(1, property);
};

export const ESCROW_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("isPrivateSale"),
    publicKey("sellerPubkey"),
    publicKey("buyerPubkey"),
    publicKey("initializerTempTokenAccountPubkey"),
    uint64("expectedAmount"),
    uint8("nonce"),
    publicKey("mintPubkey"),
]);

export interface EscrowLayout {
    isInitialized: number;
    isPrivateSale: number;
    buyerPubkey: Uint8Array;
    sellerPubkey: Uint8Array;
    initializerTempTokenAccountPubkey: Uint8Array;
    expectedAmount: Uint8Array;
    nonce: number;
    mintPubkey: Uint8Array;
}

export const TOKEN_METADATA_ACCOUNT_LAYOUT = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("isPrivateSale"),
    publicKey("sellerPubkey"),
    publicKey("buyerPubkey"),
    publicKey("initializerTempTokenAccountPubkey"),
    uint64("expectedAmount"),
    uint8("nonce"),
    publicKey("mintPubkey"),
]);

