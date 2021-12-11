
import {LAMPORTS_PER_SOL,Connection, PublicKey} from "@solana/web3.js"

export const GetSolBalance = async (pk: PublicKey, connection: Connection) => {
    return (await connection.getBalanceAndContext(pk)).value / LAMPORTS_PER_SOL
};
