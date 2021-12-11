import { Nft } from "../components/nft"
import { withRouter } from "react-router-dom";
import {
    Grid, GridItem,
} from "@chakra-ui/react"

import { SellForm } from "../components/sellform"
import { useState } from "react";

function Sell(props: any) {

    const mintVal = props.match.params.mint;

    const [youget, setYouget] = useState(0)

    function priceNotifier(yougetValue: number) {
        setYouget(yougetValue)
    }

    return <div>
        <Grid
            h="200px"
            templateRows="repeat(2, 1fr)"
            templateColumns="repeat(5, 1fr)"
            gap={4}
        >
            <GridItem colSpan={1}>
                <Nft mint={mintVal} showRoyalties={true} />
                <div className="youdGetBig">
                    You'd get
                    <div className="youGetBlock">{youget}</div>
                    SOL
                </div>
            </GridItem>
            <GridItem colSpan={4}>
                <SellForm mint={mintVal} youGetNotifier={priceNotifier} />
            </GridItem>
        </Grid>
    </div>
}


export default withRouter(Sell);