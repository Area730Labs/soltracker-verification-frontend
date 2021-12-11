import { PublicKey, Connection, AccountInfo } from '@solana/web3.js'
import { decodeMetadata, Data } from "../metadata/metadata"

import { AccountLayout } from "@solana/spl-token";

import Compress from "react-image-file-resizer";
import axios from "axios";
import sha1 from "sha1";

const TOKEN_METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");


export interface Nft {
    mint: string
    meta: Data
}

export function GetNftPic(connection: Connection, mint: string): Promise<String> {

    if (mint === undefined) {
        return Promise.reject(new Error("mint is null, cant get info"))
    }

    const fileHash = sha1(mint)

    const mintPicKey = "pic_" + fileHash

    const imgBlob = localStorage.getItem(mintPicKey)
    if (imgBlob != null) {
        return Promise.resolve(imgBlob);
    } else {
        return GetNft(connection, [mint]).then((nfts) => {

            let nft = nfts[0];

            return axios.get(nft.meta.uri).then((resp) => {
                const jsonmeta = resp.data;
                console.log("got a response:", jsonmeta.image)

                return fetch(jsonmeta.image).then((imageresp) => {
                    return imageresp.blob()
                }).then((blob) => {
                    return new Promise<string>((resolve, fail) => {

                        // put into config
                        Compress.imageFileResizer(
                            blob, // the file from input
                            480, // width
                            480, // height
                            "JPEG", // compress format WEBP, JPEG, PNG
                            70, // quality
                            0, // rotation
                            (uri) => {
                                resolve(uri as string);
                            },
                            "base64" // blob or base64 default base64
                        )
                    })
                })
            }).then((imageBlob) => {

                // update img local cache
                localStorage.setItem(mintPicKey, imageBlob)
                console.log("set imageBlob cache ", mintPicKey)

                return imageBlob;
            });
        });
    }
}

// todo cacheize this !
export function GetNft(connection: Connection, mints: Array<string>): Promise<Nft[]> {

    const allMints = [];
    const nftsResponse = [] as Nft[];

    for (var idx00 in mints) {

        const mint = mints[idx00];

        // todo add cached time
        // in order to have ability to invalidate too old items
        let mintCachedInfo = localStorage.getItem(mint)
        if (mintCachedInfo != null) {
            nftsResponse.push(JSON.parse(mintCachedInfo));
        } else {

            console.log("mint to get info of => ", mint)

            const pk = new PublicKey(mint);
            allMints.push(PublicKey.findProgramAddress([
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM.toBuffer(),
                pk.toBuffer()
            ], TOKEN_METADATA_PROGRAM));
        }
    }

    if (allMints.length === 0) {
        return Promise.resolve(nftsResponse);
    }

    return Promise.all(allMints).then((mintsMetadata) => {

        let metadataKeys = [];

        for (var idx0 in mintsMetadata) {
            let metadataAddr = mintsMetadata[idx0]
            metadataKeys.push(metadataAddr[0]);
        }

        // request for metadata accounts data
        return connection.getMultipleAccountsInfo(metadataKeys)
    }).then((resp0) => {
        console.log("got a metadata for token mint", resp0)

        var items = [];

        for (var idx1 in resp0 as AccountInfo<Buffer>[]) {

            // candy meta info
            let cminfo = (resp0[idx1]) as AccountInfo<Buffer>
            if (cminfo != null) {
                let metadataParsed = decodeMetadata(cminfo.data)

                const tokenMint = new PublicKey(metadataParsed.mint).toBase58();

                let oneItem = {
                    meta: metadataParsed.data,
                    mint: tokenMint
                } as Nft;

                setLocalStorageMintField(tokenMint, 'meta', metadataParsed.data)
                setLocalStorageMintField(tokenMint, 'mint', tokenMint)

                items.push(oneItem);
            }
            // console.log('metadata parsed',tokenMint,metadataParsed.data)
        }

        return items.concat(nftsResponse);
    });
}


export function shortenAddr(mintSelected?: string, prefixLength: number = 3) {

    if (mintSelected == null || mintSelected == undefined) {
        // return addr placeholder here
        return "";
    }

    const len = mintSelected.length;
    return mintSelected.substring(0, prefixLength) + " .. " + mintSelected.substring(len - prefixLength);
}

export function solscanAccountLink(token?: string): string {
    if (token == null || token == undefined) {
        return "";
    }

    return "https://solscan.io/account/" + token
}


function setLocalStorageMintField(mint: string, field: string, value: any) {

    let itemDataStr = localStorage.getItem(mint);
    let itemData = null;

    if (itemDataStr == null) {
        itemData = {};
    } else {
        itemData = JSON.parse(itemDataStr)
    }

    itemData[field] = value;

    localStorage.setItem(mint, JSON.stringify(itemData))
}


export function getMintTokenAccount(connection: Connection, owner: PublicKey, mint: PublicKey): Promise<PublicKey> {
    return connection.getTokenAccountsByOwner(owner, {
        mint: mint
    }).then((result) => {

        for (var tokensIdx in result.value) {
            let tokVal = result.value[tokensIdx]

            const decoded = AccountLayout.decode(tokVal.account.data)

            const amnt = decoded.amount.readIntLE();
            if (amnt === 1) {
                return tokVal.pubkey;
            }
        }

        throw new Error("No token account for mint were found");
    })

}