// useBranchTable.js
import { useRef, useState } from "react";

export const useCommitRegionProps = () => {
	const [isCommitMode, setIsCommitMode] = useState(false);
	const [branchStatusRows, setBranchStatusRows] = useState([]);
	const fileViewGridRef = useRef(null);
	const unseenFilesGridRef = useRef(null);
	const [showFilesView, setShowFilesView] = useState(false);

	return {
		isCommitMode,
		setIsCommitMode,
		branchStatusRows,
		setBranchStatusRows,
		fileViewGridRef,
		unseenFilesGridRef,
		showFilesView,
		setShowFilesView,
	};
};
