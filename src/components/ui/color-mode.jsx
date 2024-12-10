import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import { ThemeProvider, useTheme } from "next-themes";

import * as React from "react";
import { Tooltip } from "./tooltip";
import { FaMoon, FaSun } from "react-icons/fa6";

export function ColorModeProvider(props) {
	return <ThemeProvider attribute="class" disableTransitionOnChange {...props} />;
}

export function useColorMode() {
	const { resolvedTheme, setTheme } = useTheme();
	const toggleColorMode = () => {
		setTheme(resolvedTheme === "light" ? "dark" : "light");
	};
	return {
		colorMode: resolvedTheme,
		setColorMode: setTheme,
		toggleColorMode,
	};
}

export function useColorModeValue(light, dark) {
	const { colorMode } = useColorMode();
	return colorMode === "light" ? light : dark;
}

export function ColorModeIcon() {
	const { colorMode } = useColorMode();
	return colorMode === "light" ? <FaSun /> : <FaMoon />;
}

export const ColorModeButton = React.forwardRef(function ColorModeButton(props, ref) {
	const { toggleColorMode } = useColorMode();
	return (
		<ClientOnly fallback={<Skeleton boxSize="8" />}>
			<Tooltip content={"Toggle light/dark mode"} showArrow positioning={{ placement: "bottom-start" }}>
				<IconButton
					onClick={toggleColorMode}
					colorPalette={"yellow"}
					variant="subtle"
					aria-label="Toggle light/dark mode"
					size="md"
					ref={ref}
					{...props}
					css={{
						_icon: {
							width: "5",
							height: "5",
						},
					}}>
					<ColorModeIcon />
				</IconButton>
			</Tooltip>
		</ClientOnly>
	);
});
