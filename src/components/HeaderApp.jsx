import { chakra, Flex, Heading, IconButton, Image } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { FaRegSquare } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { VscChromeMinimize } from "react-icons/vsc";
import Logo from "../assets/Titan.png";
import { useApp } from "../ContextApp";

export default function HeaderApp() {
	if (!window.electron) return <></>;

	const setAppClosing = useApp((ctx) => ctx.setAppClosing);
	const [appVersion, setAppVersion] = useState("");

	useEffect(() => {
		window.electron.getAppVersion().then((version) => {
			setAppVersion(`v${version}`);
		});
	});

	const handleMinimizeWindow = useCallback(() => {
		window.electron.minimizeWindow();
	}, []);

	const handleMaximizeWindow = useCallback(() => {
		window.electron.maximizeWindow();
	}, []);

	const handleCloseWindow = useCallback(() => {
		window.electron.closeWindow();
		setAppClosing(true);
	}, []);

	return (
		<chakra.header 
			w="100%" 
			position="fixed" 
			background="linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)"
			className="titanHead notMono" 
			zIndex={9999999} 
			top={0} 
			overflow={"none"}
			borderBottom="1px solid"
			borderColor="gray.700"
			backdropFilter="blur(10px)"
			css={{
				"&::before": {
					content: '""',
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "1px",
					background: "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.5), transparent)",
				}
			}}
		>
			<Flex justifyContent="space-between" alignItems="center" p={0} position="static" h="32px">
				<Flex alignItems={"center"} gapX={2} ms={3}>
					<chakra.div
						position="relative"
						css={{
							"&::before": {
								content: '""',
								position: "absolute",
								top: "-2px",
								left: "-2px",
								right: "-2px",
								bottom: "-2px",
								background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
								borderRadius: "50%",
								opacity: 0.8,
								animation: "pulse 2s ease-in-out infinite",
							}
						}}
					>
						<Image 
							src={Logo} 
							alt="Titan Logo" 
							boxSize="18px" 
							borderRadius={"full"} 
							userSelect={"none"}
							position="relative"
							zIndex={1}
							bg="white"
							p="1px"
						/>
					</chakra.div>
					<Heading 
						as="h6" 
						size="sm" 
						fontWeight={600} 
						lineClamp={1} 
						className="animation-fadein-left-forward" 
						userSelect="none" 
						color="gray.100"
						letterSpacing="0.5px"
						css={{
							textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)"
						}}
					>
						Titan {appVersion}
					</Heading>
				</Flex>
				<Flex alignItems="center" columnGap={0} flexWrap="nowrap" wrap="nowrap" h="32px" className="titanHeadButtons">
					<IconButton
						aria-label="Minimize"
						onClick={handleMinimizeWindow}
						variant="ghost"
						_hover={{ 
							bg: "rgba(71, 85, 105, 0.6)", 
							color: "gray.100",
							transform: "scale(1.05)"
						}}
						_active={{
							bg: "rgba(71, 85, 105, 0.8)",
							transform: "scale(0.95)"
						}}
						color={"gray.300"}
						h="32px"
						w="46px"
						rounded="none"
						focusRing={"none"}
						focusVisibleRing={"none"}
						transition="all 0.15s ease"
						css={{
							_icon: {
								width: "4",
								height: "4",
							},
						}}>
						<VscChromeMinimize />
					</IconButton>
					<IconButton
						aria-label="Maximize"
						onClick={handleMaximizeWindow}
						variant="ghost"
						_hover={{ 
							bg: "rgba(71, 85, 105, 0.6)", 
							color: "gray.100",
							transform: "scale(1.05)"
						}}
						_active={{
							bg: "rgba(71, 85, 105, 0.8)",
							transform: "scale(0.95)"
						}}
						color={"gray.300"}
						h="32px"
						w="46px"
						rounded="none"
						focusRing={"none"}
						focusVisibleRing={"none"}
						transition="all 0.15s ease"
						css={{
							_icon: {
								width: "4",
								height: "4",
							},
						}}>
						<FaRegSquare />
					</IconButton>
					<IconButton
						aria-label="Close"
						onClick={handleCloseWindow}
						variant="ghost"
						_hover={{ 
							bg: "rgba(239, 68, 68, 0.9)", 
							color: "white",
							transform: "scale(1.05)"
						}}
						_active={{
							bg: "rgba(239, 68, 68, 1)",
							transform: "scale(0.95)"
						}}
						color={"gray.300"}
						h="32px"
						w="46px"
						rounded="none"
						focusRing={"none"}
						focusVisibleRing={"none"}
						transition="all 0.15s ease"
						css={{
							_icon: {
								width: "4",
								height: "4",
							},
						}}>
						<IoMdClose />
					</IconButton>
				</Flex>
			</Flex>
		</chakra.header>
	);
}
