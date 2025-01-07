import { IconButton } from "@chakra-ui/react";
import React, { useState, useCallback } from "react";
import { LuCheck, LuClipboard } from "react-icons/lu";

export default function ButtonClipboard({ size = "md", value }) {
	const [isCopied, setIsCopied] = useState(false);

	const handleCopyValue = useCallback(() => {
		if (!value) return;

		navigator.clipboard.writeText(value).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 1500);
		});
	}, [value]);

	return (
		<IconButton colorPalette={"yellow"} variant={"subtle"} onClick={handleCopyValue} size={size}>
			{isCopied ? <LuCheck /> : <LuClipboard />}
		</IconButton>
	);
}
