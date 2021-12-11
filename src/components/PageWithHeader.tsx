import {
    Heading
} from "@chakra-ui/react"

export interface PageWithHeaderOpts {
    children: JSX.Element | JSX.Element[],
    header: string
}

export function PageWithHeader(props: PageWithHeaderOpts) {
    return <div>
        <Heading size="md" marginTop="10px;">
           {props.header}
        </Heading>
        {props.children}
    </div>
}