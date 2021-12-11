import { Button } from "@chakra-ui/button";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link } from "@chakra-ui/layout";
import { Skeleton } from "@chakra-ui/skeleton";
import { ChakraProps } from "@chakra-ui/system";
import { shortenAddr, solscanAccountLink } from "../tools/nft";


export interface SolAddressProps {
    address?: string
    short?: number
    full?: boolean
    size?: string
}

export function SolAddress(props: SolAddressProps & ChakraProps) {

    // todo use app context to determine color scheme
    // if (true) { //( props.address == undefined || props.address == null) {
    //     return <Skeleton display="inline-block" width="80px" height="14px"></Skeleton>
    // }

    const linkText = props.full != undefined ?
        props.address :
        shortenAddr(props.address, props.short ?? 4)

    const sizeVal = props.size ?? "xs"

    return <Link href={solscanAccountLink(props.address)} target="_blank">
        <Button variant="outline" colorScheme="teal" size={sizeVal}><ExternalLinkIcon marginRight="5px"/>{linkText}</Button>
    </Link>
}