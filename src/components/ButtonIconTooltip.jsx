import { IconButton } from "@chakra-ui/react";
import React from "react";
import { useCallback } from "react";
import { Tooltip } from "./ui/tooltip";

export default function ButtonIconTooltip(props) {
	const { icon, onClick, colorPalette, label, size, placement, disabled = false } = props;

	const handleClick = useCallback(() => {
		if (onClick) onClick();
	}, [onClick]);

	return label && placement ? (
		<Tooltip content={label} showArrow positioning={{ placement }}>
			<IconButton aria-label={label} size={size} onClick={handleClick} colorPalette={colorPalette} disabled={disabled}>
				{icon}
			</IconButton>
		</Tooltip>
	) : (
		<IconButton aria-label={label} size={size} onClick={handleClick} colorPalette={colorPalette} disabled={disabled}>
			{icon}
		</IconButton>
	);
}
