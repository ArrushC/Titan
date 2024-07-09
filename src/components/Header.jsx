import { Flex, Heading, Icon, IconButton, Image, Tooltip } from "@chakra-ui/react";
import React from "react";
import Logo from "../assets/Titan.png";
import { useApp } from "../AppContext";
import { MdCode, MdCodeOff } from "react-icons/md";

export default function Header() {
	const { isDebug, setIsDebug } = useApp();

	return (
		<Flex justifyContent={"space-between"} mb={5}>
			<Flex alignItems="center">
				<Image src={Logo} alt="Titan Logo" boxSize="100px" mr={10} borderRadius={"full"} />
				<Heading as={"h1"} size={"3xl"} noOfLines={1}>
					Titan
				</Heading>
			</Flex>
			<Flex alignItems={"center"}>
				<Tooltip label={`Current Debug Mode: ${isDebug ? "on" : "off"}`} hasArrow placement="left">
					<IconButton aria-label="Toggle Debug Mode" colorScheme={"yellow"} icon={!isDebug ? <Icon as={MdCodeOff} /> : <Icon as={MdCode} />} onClick={() => setIsDebug((prev) => !prev)} />
				</Tooltip>
			</Flex>
		</Flex>
	);
}
