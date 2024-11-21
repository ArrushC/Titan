import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import React from "react";

export function Provider(props) {
	return (
		<ChakraProvider value={defaultSystem}>
			<ColorModeProvider {...props} />
		</ChakraProvider>
	);
}
