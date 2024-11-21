import React from "react";
import { useCallback } from "react";
import { Tooltip } from "./ui/tooltip";
import { IconButton } from "@chakra-ui/react";

export default function ButtonElectron(props) {
	const { icon, onClick, colorPalette, label, size } = props;

	const handleClick = useCallback(() => {
		if (onClick) onClick();
	}, [onClick]);

	return (
		<Tooltip content={window.electron ? label : "Feature must be used in desktop application"} showArrow>
			<IconButton aria-label={label} size={size} onClick={handleClick} colorPalette={colorPalette} disabled={!window.electron}>
				{icon}
			</IconButton>
		</Tooltip>
	);
}
