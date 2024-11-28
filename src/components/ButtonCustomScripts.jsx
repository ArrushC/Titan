import React, { useMemo } from "react";
import { useCallback } from "react";
import { Tooltip } from "./ui/tooltip";
import { IconButton } from "@chakra-ui/react";
import {
	TbAsterisk,
	TbLetterA,
	TbLetterB,
	TbLetterC,
	TbLetterD,
	TbLetterE,
	TbLetterF,
	TbLetterG,
	TbLetterH,
	TbLetterI,
	TbLetterJ,
	TbLetterK,
	TbLetterL,
	TbLetterM,
	TbLetterN,
	TbLetterO,
	TbLetterP,
	TbLetterQ,
	TbLetterR,
	TbLetterS,
	TbLetterT,
	TbLetterU,
	TbLetterV,
	TbLetterW,
	TbLetterX,
	TbLetterY,
	TbLetterZ,
} from "react-icons/tb";

export default function ButtonCustomScripts(props) {
	const { onClick, colorPalette, label, size } = props;

	const handleClick = useCallback(() => {
		if (onClick) onClick();
	}, [onClick]);

	const icon = useMemo(() => {
		const firstChar = label.charAt(0).toUpperCase();

		switch (firstChar) {
			case "A":
				return <TbLetterA />;
			case "B":
				return <TbLetterB />;
			case "C":
				return <TbLetterC />;
			case "D":
				return <TbLetterD />;
			case "E":
				return <TbLetterE />;
			case "F":
				return <TbLetterF />;
			case "G":
				return <TbLetterG />;
			case "H":
				return <TbLetterH />;
			case "I":
				return <TbLetterI />;
			case "J":
				return <TbLetterJ />;
			case "K":
				return <TbLetterK />;
			case "L":
				return <TbLetterL />;
			case "M":
				return <TbLetterM />;
			case "N":
				return <TbLetterN />;
			case "O":
				return <TbLetterO />;
			case "P":
				return <TbLetterP />;
			case "Q":
				return <TbLetterQ />;
			case "R":
				return <TbLetterR />;
			case "S":
				return <TbLetterS />;
			case "T":
				return <TbLetterT />;
			case "U":
				return <TbLetterU />;
			case "V":
				return <TbLetterV />;
			case "W":
				return <TbLetterW />;
			case "X":
				return <TbLetterX />;
			case "Y":
				return <TbLetterY />;
			case "Z":
				return <TbLetterZ />;
			default:
				return <TbAsterisk />;
		}
	}, [label]);

	return (
		<Tooltip content={window.electron ? label : "Feature must be used in desktop application"} showArrow>
			<IconButton aria-label={label} size={size} onClick={handleClick} colorPalette={colorPalette} variant={"subtle"} disabled={!window.electron}>
				{icon}
			</IconButton>
		</Tooltip>
	);
}
