
import { FormControl, Switch, FormLabel, Input, FormHelperText, FormErrorMessage, Button } from "@chakra-ui/react"
import { InfoIcon } from "@chakra-ui/icons"
import { useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { GetNft } from "../tools/nft";
import { useConnection } from "@solana/wallet-adapter-react";
import useApp from "../appcontext";

function FormInput(props) {
    return (
        <div className="inputgroup">
            <label><b>{props.label}</b></label>
            <div style={{ "textAlign": "left" }}>
                {props.children}
            </div>
        </div>
    )
}

export function SellForm(props) {

    const mintAddr = props.mint;

    const { connection } = useConnection();
    const {setSellForm,escrowFeeBasisPoints} = useApp();

    const [nft, setNft] = useState(undefined);
    const [destaddress, setDestaddress] = useState("")
    const [price, setPrice] = useState(1);
    const [payroyalties, setPayroyalties] = useState(false)
    
    const [fbPoints, setfbPoints] = useState(0);

    function onPriceChange(e) {
        const nv = e.target.value
        setPrice(nv)
    }

    function onAddressChange(e) {
        const nv = e.target.value
        setDestaddress(nv)
    }

    function royaltiesChange(e) {
        if (payroyalties) {
            setPayroyalties(false)
        } else {
            setPayroyalties(true)
        }
    }

    useMemo(async () => {
        // set nft info
        const nftObj = await GetNft(connection, [mintAddr]);
        setNft(nftObj)

        setfbPoints(nftObj[0].meta.sellerFeeBasisPoints)

        console.log('set avail = true')
    }, [mintAddr])

    const info = useMemo(() => {

        // calc fees
        let feesVal = 0;
        let yougetVal = 0;
        let eIncomeVal = 0;

        const priceLamports = price * LAMPORTS_PER_SOL;
        let feesBasisPointsTotal = escrowFeeBasisPoints;

        if (payroyalties) {
            feesBasisPointsTotal += fbPoints;
        }

        feesVal = (feesBasisPointsTotal) / 100;
        yougetVal = Math.round(100*((price * (100 - feesVal) / 100)))/100;
        eIncomeVal = (price * (escrowFeeBasisPoints / 100) / 100);

        const resp = {
            fees: feesVal,
            youget: yougetVal,
            escrowIncome: eIncomeVal
        };

        if (props.youGetNotifier != undefined) {
            props.youGetNotifier(yougetVal)
        }

        // // update app context
        setSellForm({
            price: price,
            is_private_sell: destaddress != "",
            buyersAddress: destaddress,
            payroyalties: payroyalties,
            mint: mintAddr
        });

        return resp;

    }, [payroyalties, price, fbPoints,destaddress])

    return (
        <form>
            <FormInput label="Sell price">
                <Input className="sellinput" autoComplete="off" type="text" id="price" value={price} onChange={onPriceChange} />
            </FormInput>
            <FormInput label="Buyer's wallet">
                <Input className="sellinput" autoComplete="off" type="text" id="price" value={destaddress} onChange={onAddressChange} />
                <div className="subinfo">
                    <InfoIcon /> buyer's wallet address. only provided wallet would have ability to pay for your nft
                </div>
            </FormInput>
            {/* <div className="inputgroup">
                <label>
                    <input type="checkbox" id="payroyalties" checked={payroyalties} onChange={royaltiesChange} />
                    <b> Pay royalties</b>
                </label>
                <div className="subinfo">
                    <InfoIcon /> royalties payed to nft creators upon sale
                </div>
            </div> */}
            <FormInput label={"Escrow fee"}>
                <Input className="sellinput" disabled={true} type="text" id="fees" value={info.fees + "%"} />
            </FormInput>
        </form>
    )
}