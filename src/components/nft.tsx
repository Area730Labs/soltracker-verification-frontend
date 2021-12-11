
import Loader from "react-loader-spinner";

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

import { useHistory } from "react-router-dom";

// do not use wallet connection  for this. it should use app wide connection. not wallet
// cause wallet requires every time login on page refresh which is not comfortable for user
import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useMemo, Component } from 'react';

import { GetNftPic, GetNft, Nft as NftType } from "../tools/nft";

import { Box, Image, Badge, useColorMode, SkeletonCircle, SkeletonText, Skeleton } from "@chakra-ui/react"
import useApp from "../appcontext";

const styles = {
  nft: "nft-item"
}

export interface NftInfo {
  blob?: string | String,
  nft?: NftType
}

export interface NftProps {
  mint: string
  owned?: boolean,
  showSellBtn?: boolean
  showRoyalties?: boolean

  width?: number
  children?: JSX.Element
}

export function Nft(props: NftProps) {

  const { connection } = useConnection();

  const [data, setData] = useState<NftInfo>({
    blob: undefined,
    nft: undefined
  });

  useMemo(async () => {

    const blob = await GetNftPic(connection, props.mint);
    const nft = await GetNft(connection, [props.mint]);

    const result = {
      "blob": blob,
      "nft": nft[0]
    } as NftInfo;

    setData(result);
  }, [props.mint])

  let ownedBadge = null;
  if (props.owned !== undefined) {
    ownedBadge = (<Badge borderRadius="full" px="2" colorScheme="blue">
      owned
    </Badge>);
  }

  let { nftWidth } = useApp();
  if (props.width != undefined) {
    nftWidth = props.width;
  }

  const { colorMode } = useColorMode()

  let style = {
    boxShadow: "-1px 1px 22px -1px rgba(34, 60, 80, 0.2)",
  } as any;

  let styleHover = {
    boxShadow: "0px -1px 54px 22px rgba(34, 60, 80, 0.2)",
  } as any

  if (colorMode == "dark") {
    styleHover = {
      border: "1px solid white",
      boxSizing: "border-box"
    }
    style = {
      boxShadow: "-1px 1px 22px -1px rgba(255, 255, 255, 0.2)"
    };
  }

  if (data.nft != undefined) {
    return (
      <Box className="nft-entry" _hover={styleHover} style={style} maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" w={nftWidth + "px"}>
        <Image src={data.blob as string} alt={data.nft.meta.name} w={"100wv"} />
        <Box p="6">
          <Box display="flex" alignItems="baseline">
            {ownedBadge}
          </Box>

          <Box
            mt="1"
            fontWeight="semibold"
            as="h4"
            lineHeight="tight"
            isTruncated
          >
            {data.nft.meta.name}
          </Box>

          {props.children !== undefined ? (
            <Box>
              <Box as="span" color="gray.600" fontSize="sm">
                {props.children}
              </Box>
            </Box>) : null}

          {props.showRoyalties !== undefined && props.showRoyalties ? (
            <Box display="flex" mt="2" alignItems="center">
              <Box as="span" ml="2" color="gray.600" fontSize="sm">
                Royalties:  {data.nft.meta.sellerFeeBasisPoints / 100}%
                    </Box>
            </Box>) : null}
        </Box>
      </Box>
    )
  } else {
    return (<Box className="nft-entry" _hover={styleHover} style={style} maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden" w={nftWidth + "px"}>
      <Box p="6">
        <Skeleton width="100%" height="180px" />
        <SkeletonText mt="4" noOfLines={2} spacing="4" />
        <Box marginTop="20px">
          <Skeleton width="100%" height="40px" />
        </Box>
      </Box>
    </Box>)
  }
}