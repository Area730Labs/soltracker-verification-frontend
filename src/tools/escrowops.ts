import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  SYSVAR_RENT_PUBKEY,
  Connection,
  AccountInfo,
  SystemInstruction,
  CompiledInstruction,
  ConfirmedTransaction,
  CompiledInnerInstruction
} from "@solana/web3.js"


import { AccountLayout, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { ESCROW_ACCOUNT_DATA_LAYOUT, EscrowLayout } from "../metadata/escrow";

import BN from "bn.js";

import { getMintTokenAccount } from "./nft"
import { TxGenResponse } from "./tx"
import { SellFormType } from "../appcontext";
import { EscrowInfoComposed } from "../pages/escrows";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import moment from "moment";

export function SellMint(publicKey: PublicKey, connection: Connection, appProgramId: PublicKey, sellForm: SellFormType): Promise<TxGenResponse> {

  if (publicKey == undefined) {
    return Promise.reject(new Error("selling with no wallet unlocked"))
  }

  const PriceLamports = sellForm.price * LAMPORTS_PER_SOL;

  // todo use fucking ts everywhere
  const XTokenMintPubkey = new PublicKey(sellForm.mint);

  return getMintTokenAccount(connection, publicKey, XTokenMintPubkey).then((aliceXTokenAccountPubkey) => {

    console.log(`selling item ${sellForm.mint}, program: ${appProgramId}, using wallet ${publicKey}. token account ${aliceXTokenAccountPubkey}`)

    return Promise.all([connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ), connection.getMinimumBalanceForRentExemption(
      ESCROW_ACCOUNT_DATA_LAYOUT.span
    )]).then((lamportsPerByte) => {

      const resp = {
        signers: [],
        transaction: {} as Transaction
      } as TxGenResponse;

      const lamportsRequiredForAccount = lamportsPerByte[0];
      const lamportsRequiredForEscrowAccount = lamportsPerByte[1];

      const tempXTokenAccountKeypair = new Keypair();
      resp.signers.push({
        publicKey: tempXTokenAccountKeypair.publicKey,
        secretKey: tempXTokenAccountKeypair.secretKey
      })

      const createTempTokenAccountIx = SystemProgram.createAccount({
        programId: TOKEN_PROGRAM_ID,
        space: AccountLayout.span,
        lamports: lamportsRequiredForAccount,
        fromPubkey: publicKey as PublicKey,
        newAccountPubkey: tempXTokenAccountKeypair.publicKey,
      });

      const initTempAccountIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        XTokenMintPubkey,
        tempXTokenAccountKeypair.publicKey,
        publicKey
      );

      const transferXTokensToTempAccIx = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        aliceXTokenAccountPubkey,
        tempXTokenAccountKeypair.publicKey,
        publicKey,
        [],
        1
      );
      const escrowKeypair = new Keypair();
      resp.signers.push({
        publicKey: escrowKeypair.publicKey,
        secretKey: escrowKeypair.secretKey
      });

      const createEscrowAccountIx = SystemProgram.createAccount({
        space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
        lamports: lamportsRequiredForEscrowAccount,
        fromPubkey: publicKey,
        newAccountPubkey: escrowKeypair.publicKey,
        programId: appProgramId,
      });

      console.log(`initializing escrow at ${escrowKeypair.publicKey}`)

      const keysArray = [
        { pubkey: publicKey, isSigner: true, isWritable: false },
        {
          pubkey: tempXTokenAccountKeypair.publicKey,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: escrowKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // { pubkey: walletKey, isSigner: false,isWritable: true}
      ];

      if (sellForm.is_private_sell) {
        keysArray.push({ pubkey: sellForm.buyersAddress as PublicKey, isSigner: false, isWritable: true })
      } else {
        console.log('this is not a private sell')
      }

      const initEscrowIx = new TransactionInstruction({
        programId: appProgramId,
        keys: keysArray,
        data: Buffer.from(
          Uint8Array.of(0, sellForm.is_private_sell ? 1 : 0, ...new BN(PriceLamports).toArray("le", 8))
        ),
      });

      const tx = new Transaction().add(
        createTempTokenAccountIx,
        initTempAccountIx,
        transferXTokensToTempAccIx,
        createEscrowAccountIx,
        initEscrowIx
      );

      resp.transaction = tx;

      return resp;
    });
  });
}

export function BuyItem(publicKey: PublicKey, connection: Connection,
  appProgramId: PublicKey, appTreasury: PublicKey,
  escrowAccountPubkey: PublicKey, mintToReceivePubkey: PublicKey): Promise<TxGenResponse> {

  return connection.getAccountInfo(
    escrowAccountPubkey
  ).then((escrowAccount) => {

    const encodedEscrowState = escrowAccount?.data;
    const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
      encodedEscrowState
    ) as EscrowLayout;
    const escrowState = {
      escrowAccountPubkey: escrowAccountPubkey,
      isInitialized: !!decodedEscrowLayout.isInitialized,
      initializerAccountPubkey: new PublicKey(
        decodedEscrowLayout.sellerPubkey
      ),
      XTokenTempAccountPubkey: new PublicKey(
        decodedEscrowLayout.initializerTempTokenAccountPubkey
      ),
      expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le"),
    };

    const tempTokenWrapper = new Keypair();

    return connection.getMinimumBalanceForRentExemption(
      AccountLayout.span
    ).then(tokenAccountMinBalance => {

      // create token wrapper account for buyer
      const buyerTokenWrapCreateIx = SystemProgram.createAccount({
        programId: TOKEN_PROGRAM_ID,
        space: AccountLayout.span,
        lamports: tokenAccountMinBalance,
        fromPubkey: publicKey,
        newAccountPubkey: tempTokenWrapper.publicKey,
      });

      const initTempAccountIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        mintToReceivePubkey,
        tempTokenWrapper.publicKey,
        publicKey
      );

      return PublicKey.findProgramAddress(
        [Buffer.from("escrow")],
        appProgramId
      ).then(PDA => {

        const exchangeInstruction = new TransactionInstruction({
          programId: appProgramId,
          data: Buffer.from(
            Uint8Array.of(1, 0)
          ),
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: false },
            { pubkey: escrowAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: tempTokenWrapper.publicKey, isSigner: true, isWritable: true },
            {
              pubkey: escrowState.XTokenTempAccountPubkey,
              isSigner: false,
              isWritable: true,
            },
            { // seller account
              pubkey: escrowState.initializerAccountPubkey,
              isSigner: false,
              isWritable: true,
            },
            { pubkey: PDA[0], isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: appTreasury, isSigner: false, isWritable: true }
          ],
        });


        return {
          transaction: new Transaction()
            .add(buyerTokenWrapCreateIx)
            .add(initTempAccountIx)
            .add(exchangeInstruction),
          signers: [{
            publicKey: tempTokenWrapper.publicKey,
            secretKey: tempTokenWrapper.secretKey
          }]
        };
      });
    })
  });


}


export function CancelEscrow(
  publicKey: PublicKey,
  connection: Connection,
  escrowProgramId: PublicKey,
  escrowAccountPubkey: PublicKey,
  mint: PublicKey): Promise<TxGenResponse> {

  return connection.getAccountInfo(
    escrowAccountPubkey
  ).then((escrowAccount) => {

    const encodedEscrowState = escrowAccount?.data;
    const decodedEscrowLayout = ESCROW_ACCOUNT_DATA_LAYOUT.decode(
      encodedEscrowState
    ) as EscrowLayout;

    const escrowState = {
      escrowAccountPubkey: escrowAccountPubkey,
      isInitialized: !!decodedEscrowLayout.isInitialized,
      isPrivateSale: !!decodedEscrowLayout.isPrivateSale,
      initializerAccountPubkey: new PublicKey(
        decodedEscrowLayout.sellerPubkey
      ),
      EscrowTokenAccount: new PublicKey(
        decodedEscrowLayout.initializerTempTokenAccountPubkey
      ),
      expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le"),
    };

    // check if i have a token account for given mint
    return connection.getTokenAccountsByOwner(publicKey, {
      mint: mint
    }).then((resp) => {
      console.log('get token account holder', resp);

      let sellerTokenAccountPubkey: PublicKey | null = null;

      if (resp.value.length == 0) {
        // create new token account
        throw new Error('owner has no token account for a mint. need to create and init one. We have not implemented this yet. write to us, and we\'ll help you');
      } else {
        // as nft has 1 maxQuantity, if the user has token account for it - its empty,
        // cause one item is in escrow's possessison
        sellerTokenAccountPubkey = resp.value[0].pubkey
      }

      return PublicKey.findProgramAddress(
        [Buffer.from("escrow")],
        escrowProgramId
      ).then(PDA => {

        const cancelInstruction = new TransactionInstruction({
          programId: escrowProgramId,
          data: Buffer.from(
            Uint8Array.of(2, 0)
          ),
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: false },// owner
            { pubkey: escrowAccountPubkey, isSigner: false, isWritable: true }, // escrow info
            { pubkey: sellerTokenAccountPubkey as PublicKey, isSigner: false, isWritable: true }, // owner's token account
            { // escrow's token account
              pubkey: escrowState.EscrowTokenAccount,
              isSigner: false,
              isWritable: true,
            },
            { pubkey: PDA[0], isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          ],
        });


        return {
          transaction: new Transaction()
            .add(cancelInstruction),
          signers: []
        } as TxGenResponse;
      });
    })
  });
}
export interface NftMinterInfoPayment {
  type: string
  value: number
  mintToken?: string
}

export interface NftMinterInfo {
  candyMachine?: string,
  mintPayment: NftMinterInfoPayment,
  createdTimeAgo: string
  createdTime: string
  minter: string,
  sig: string
}

export function getNftMinterInfo(connection: Connection, mkey: PublicKey): Promise<NftMinterInfo> {


  const cacheKey = "nftmint_" + mkey.toBase58()
  let cachedStr = localStorage.getItem(cacheKey);
  if (cachedStr != undefined) {

    const response: NftMinterInfo = JSON.parse(cachedStr)
    return Promise.resolve(response);
  } else {
    return connection.getConfirmedSignaturesForAddress2(mkey).then((sigs) => {

      // get 1st signature
      let last = sigs[sigs.length - 1];

      const candyMachineIdSt = "cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ";

      return connection.getConfirmedTransaction(last.signature).then((_txinfo) => {

        const txinfo = _txinfo as ConfirmedTransaction;

        let paymentType = {
          type: 'sol',
          value: 0,
          mintToken: undefined
        } as NftMinterInfoPayment

        const tParsed = moment.unix(txinfo.blockTime as number);
        const minter = txinfo.transaction.feePayer as PublicKey

        const instrs = txinfo?.transaction.instructions as TransactionInstruction[]

        let instructionIdx = 0;
        for (let cur of instrs) {
          if (cur.programId.toBase58() == candyMachineIdSt) {

            // found candy instruction

            const keysForCM = txinfo.transaction.compileMessage().accountKeys

            // for sure, cause we have a candy machine instr
            const innerInstr = txinfo.meta?.innerInstructions as CompiledInnerInstruction[]

            for (let cur0 of innerInstr) {
              if (cur0.index == instructionIdx as number) {
                const candyMachineInstructions = cur0.instructions;


                if (keysForCM[candyMachineInstructions[0].programIdIndex].equals(SystemProgram.programId)) {
                  const transferInfo = SystemInstruction.decodeTransfer(new TransactionInstruction({
                    keys: cur.keys,
                    programId: SystemProgram.programId,
                    data: bs58.decode((candyMachineInstructions[0].data) as string)
                  }))

                  paymentType.value = transferInfo.lamports
                } else {
                  // probably its a mint token
                  paymentType.type = "minttoken";
                  paymentType.mintToken = "?"
                }

                const candyMachineAddress = cur.keys[1].pubkey;

                const item: NftMinterInfo = {
                  candyMachine: candyMachineAddress.toBase58(),
                  mintPayment: paymentType,
                  createdTimeAgo: tParsed.fromNow(),
                  createdTime: tParsed.format(),
                  minter: minter.toBase58(),
                  sig: last.signature
                };

                localStorage.setItem(cacheKey, JSON.stringify(item))

                return item;

              }
            }
          }
          instructionIdx++;
        }

        paymentType.type = 'noncandymachine';

        return {
          candyMachine: undefined,
          mintPayment: paymentType,
          createdTimeAgo: tParsed.fromNow(),
          createdTime: tParsed.format("MMMM Do YYYY, hh:mm:ss"),
          minter: minter.toBase58(),
          sig: last.signature
        } as NftMinterInfo;

      })
    })
  }
}

export function getEscrowInfo(programId: PublicKey, connection: Connection, mintAddr: PublicKey): Promise<EscrowInfoComposed> {


  const cacheKey = "escrow_" + mintAddr.toBase58();
  const cached = localStorage.getItem(cacheKey);

  if (cached != undefined) {

    const cachedItem = JSON.parse(cached);

    const parsed: EscrowInfoComposed = {
      mint: new PublicKey(cachedItem.mint),
      escrowAddress: new PublicKey(cachedItem.escrowAddress),
      escrow: ESCROW_ACCOUNT_DATA_LAYOUT.decode(Buffer.from(cachedItem.escrow))
    }

    return Promise.resolve(parsed);
  } else {

    console.log("looking for accounts lenght", ESCROW_ACCOUNT_DATA_LAYOUT.span)

    return connection.getProgramAccounts(programId, {
      filters: [
        { dataSize: ESCROW_ACCOUNT_DATA_LAYOUT.span },
        {
          memcmp: {
            offset: ESCROW_ACCOUNT_DATA_LAYOUT.span - 32,
            bytes: mintAddr.toBase58()
          }
        }]
    }).then(resp => {

      const escrowAccount = resp[0].account
      const decoded = ESCROW_ACCOUNT_DATA_LAYOUT.decode(escrowAccount.data);

      let constructed: EscrowInfoComposed = {
        escrow: decoded,
        escrowAddress: resp[0].pubkey,
        mint: new PublicKey(decoded.mintPubkey),
      };

      localStorage.setItem(cacheKey, JSON.stringify({
        'mint': constructed.mint.toBase58(),
        'escrow': escrowAccount.data.toJSON(),
        "escrowAddress": constructed.escrowAddress.toBase58()
      }))

      return constructed as EscrowInfoComposed;
    });
  }
}

export function getUsersEscrows(connection: Connection, programId: PublicKey, wallet: PublicKey): any {
  const constructed = [] as EscrowInfoComposed[];

  return connection.getProgramAccounts(programId, {
    filters: [
      { dataSize: ESCROW_ACCOUNT_DATA_LAYOUT.span },
      {
        memcmp: {
          offset: 2,
          bytes: wallet.toBase58()
        }
      }]
  }).then((items) => {

    for (var idx in items) {

      const it = items[idx];
      const decodedEscrowInfo = ESCROW_ACCOUNT_DATA_LAYOUT.decode(it.account.data);

      const mintAddr = new PublicKey(decodedEscrowInfo.mintPubkey);

      constructed.push({
        escrow: decodedEscrowInfo,
        escrowAddress: it.pubkey,
        mint: mintAddr,
      } as EscrowInfoComposed)
    }

    return constructed;
  });
}
