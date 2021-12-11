import useApp from "../appcontext"
import {Grid} from "@chakra-ui/react"

export interface ItemgridProps {
    children?: JSX.Element[] | JSX.Element
}

export function ItemGrid(props:ItemgridProps) {

    const { cols } = useApp();
    const gridColumns = "repeat(" + cols + ", 1fr)"

    return  <Grid className="itemGrid" templateColumns={gridColumns} gap={6}>{props.children}</Grid>
}