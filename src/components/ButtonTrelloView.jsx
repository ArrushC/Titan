import { IconButton } from "@chakra-ui/react";
import React from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function ButtonTrelloView(props) {
	const { data } = props;
	const handleTrelloView = async () => {
		window.open(data.url, "_blank");
	};

	return <IconButton aria-label="Diff" size="sm" icon={<FaExternalLinkAlt  />} onClick={handleTrelloView} colorPalette="yellow" />;
}
