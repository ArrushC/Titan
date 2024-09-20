import { IconButton, Tooltip } from "@chakra-ui/react";
import React from "react";
import { useCallback } from "react";

export default function ButtonIconTooltip(props) {
	const { icon, onClick, colorScheme, label, size, placement, isDisabled = false } = props;

	const handleClick = useCallback(() => {
		if (onClick) onClick();
	}, [onClick]);

	return label && placement ? (
		<Tooltip label={label} hasArrow placement={placement}>
			<IconButton aria-label={label} size={size} icon={icon} onClick={handleClick} colorScheme={colorScheme} isDisabled={isDisabled} />
		</Tooltip>
	) : (
		<IconButton aria-label={label} size={size} icon={icon} onClick={handleClick} colorScheme={colorScheme} isDisabled={isDisabled} />
	);
}
