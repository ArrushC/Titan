import { Flex, Heading, Icon, IconButton, Image, Tooltip } from "@chakra-ui/react";
import React from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdCode, MdCodeOff, MdOutlineSettings } from "react-icons/md";
import useSocketEmits from "../hooks/useSocketEmits";

export default function Header() {
	const { isDebug, setIsDebug } = useApp();
	const {emitOpenConfig} = useSocketEmits();

	return (
		<Flex justifyContent={"space-between"} mb={5}>
			<Flex alignItems="center">
				<Image src={Logo} alt="Titan Logo" boxSize="100px" mr={10} borderRadius={"full"} />
				<Heading as={"h1"} size={"3xl"} noOfLines={1}>
					Titan
				</Heading>
			</Flex>
			<Flex alignItems={"center"} columnGap={2}>
				<Tooltip label={`Current Debug Mode: ${isDebug ? "on" : "off"}`} hasArrow placement="left">
					<IconButton aria-label="Toggle Debug Mode" colorScheme={"yellow"} icon={!isDebug ? <Icon as={MdCodeOff} /> : <Icon as={MdCode} />} onClick={() => setIsDebug((prev) => !prev)} />
				</Tooltip>
				<Tooltip label={"Open configuration file"} hasArrow placement="bottom-start">
					<IconButton aria-label="Open configuration file" colorScheme={"yellow"} icon={ <Icon as={MdOutlineSettings  } />} onClick={() => emitOpenConfig()} />
				</Tooltip>
			</Flex>
		</Flex>
	);
}
