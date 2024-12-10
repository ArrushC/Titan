import { IconButton } from "@chakra-ui/react";
import React from "react";
import { useCallback } from "react";
import { Tooltip } from "./ui/tooltip.jsx";

export default function ButtonIconTooltip(props) {
	const { icon, onClick, colorPalette, label, size, placement, variant= "solid", disabled = false } = props;

	const handleClick = useCallback(() => {
		if (onClick) onClick();
	}, [onClick]);

	const iconButton = (
		<IconButton aria-label={label || ""} size={size} onClick={handleClick} colorPalette={colorPalette} variant={variant} disabled={disabled}>
			{icon}
		</IconButton>
	);

	return label && placement ? (
		<Tooltip content={label} showArrow positioning={{ placement }}>
			{iconButton}
		</Tooltip>
	) : (
		iconButton
	);
}
