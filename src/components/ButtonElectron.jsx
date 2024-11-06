import { IconButton, Tooltip } from "@chakra-ui/react";
import React from "react";
import { useCallback } from "react";


export default function ButtonElectron(props) {
	const { icon, onClick, colorScheme, label, size } = props;

	const handleClick = useCallback(() => {
		if (onClick) onClick();
	}, [onClick]);

	return (
		<Tooltip label={window.electron ? label : "Feature must be used in desktop application"} hasArrow>
			<IconButton aria-label={label} size={size} icon={icon} onClick={handleClick} colorScheme={colorScheme} isDisabled={!window.electron} />
		</Tooltip>
	);
}