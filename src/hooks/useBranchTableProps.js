// useBranchTable.js
import { useRef, useState } from "react";

export const useBranchTableProps = () => {
	const [configurableRowData, setConfigurableRowData] = useState([]);
	const [branchInfos, setBranchInfos] = useState({});
	const branchTableGridRef = useRef(null);
	const [selectedRows, setSelectedRows] = useState([]);

	return {
		configurableRowData,
		setConfigurableRowData,
		branchInfos,
		setBranchInfos,
		branchTableGridRef,
		selectedRows,
		setSelectedRows,
	};
};
