import { CopyIcon, DragHandleIcon } from "@chakra-ui/icons";
import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useMemo } from "react";
import { useApp } from "../AppContext";
import { IconButton, Tooltip } from "@chakra-ui/react";
import { stripBranchInfo } from "../utils/CommonConfig";

export default function TableBranches({rowData, onRowValueChanged}) {
	const {config, branchTableGridRef, updateConfig, isDebug, selectedBranches, setSelectedBranches, setSelectedBranchStatuses, setShowCommitView} = useApp();
	
	const copyRow = useCallback(
		(currentRowData) => {
			const newRow = {
				...currentRowData,
				id: String(Date.now()),
				"Branch Info": "Hasn't been refreshed",
			};
			updateConfig((currentConfig) => ({
				...currentConfig,
				branches: stripBranchInfo([...currentConfig.branches, newRow]),
			}));
		},
		[updateConfig]
	);

	const onSelectionChanged = useCallback(
		(event) => {
			const newSelectedRows = branchTableGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
			if (isDebug) console.log("SectionBranches.jsx: onSelectionChanged - event", event);
			if (isDebug) console.log("SectionBranches.jsx: onSelectionChanged - selectedBranches", selectedBranches);
			// If the grid has updated rows then we need to reselect them to maintain the selection
			if (event?.source == "rowDataChanged") {
				const selectedIds = selectedBranches.map((row) => row.id);
				branchTableGridRef?.current?.api?.forEachNode((node) => {
					if (selectedIds.includes(node.data.id)) {
						node.setSelected(true);
					}
				});
				return;
			} else if (!["api"].includes(event?.source)) {
				setSelectedBranches(newSelectedRows);
				setSelectedBranchStatuses([]);
				setShowCommitView(false);
			}
		},
		[isDebug, branchTableGridRef, selectedBranches, setSelectedBranches, setShowCommitView]
	);

	const onRowDragEnd = useCallback(
		(event) => {
			const movedRowData = [];
			event.api.forEachNode((node) => movedRowData.push(node.data));
			if (isDebug) console.debug("SectionBranches.jsx: onRowDragEnd - movedRowData", movedRowData);
			updateConfig((currentConfig) => ({ ...currentConfig, branches: stripBranchInfo(movedRowData) }));
		},
		[updateConfig, isDebug]
	);

	const getRowStyle = useCallback(
		(params) => {
			const color = config?.branchFolderColours[params.data["Branch Folder"]];
			return {
				backgroundColor: color ? `${color}20` : "transparent", // Adding some transparency
			};
		},
		[config?.branchFolderColours]
	);

	const defaultColDef = useMemo(
		() => ({
			resizable: true,
			wrapText: true,
			autoHeight: true,
			filter: true,
			suppressMovable: true,
			editable: true,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		}),
		[]
	);

	const colDefs = useMemo(
		() => [
			{ field: "", rowDrag: true, resizable: false, filter: false, suppressMovable: false, editable: false, width: 20, cellRenderer: DragHandleIcon, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ headerCheckboxSelection: true, checkboxSelection: true, headerCheckboxSelectionFilteredOnly: true, width: 20, resizable: false, suppressMovable: false, filter: false, editable: false, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ field: "Branch Folder", resizable: false, width: 130, valueFormatter: (params) => params.value.toUpperCase() },
			{ field: "Branch Version", resizable: false, width: 130 },
			{ field: "SVN Branch", flex: 1 },
			{ field: "Branch Info", editable: false, resizable: false, width: 200 },
			{
				headerName: "",
				width: 70,
				resizable: false,
				sortable: false,
				filter: false,
				editable: false,
				cellRenderer: (params) => (
					<Tooltip label="Copy Row" hasArrow>
						<IconButton colorScheme={"yellow"} aria-label="Copy Row" size="sm" onClick={() => copyRow(params.data)} icon={<CopyIcon />} />
					</Tooltip>
				),
			},
		],
		[config, copyRow]
	);

	return (
		<div className="ag-theme-quartz-dark">
			<AgGridReact
				ref={branchTableGridRef}
				rowData={rowData}
				defaultColDef={defaultColDef}
				columnDefs={colDefs}
				stopEditingWhenCellsLoseFocus={true}
				getRowStyle={getRowStyle}
				onRowDragEnd={onRowDragEnd}
				domLayout="autoHeight"
				suppressRowClickSelection={true}
				rowSelection={"multiple"}
				rowMultiSelectWithClick={true}
				animateRows={true}
				rowDragManaged={true}
				onSelectionChanged={onSelectionChanged}
				onRowValueChanged={onRowValueChanged}
				columnMenu={"new"}
				editType={"fullRow"}
				deltaRowDataMode={true}
				getRowNodeId={(data) => data.id}
				immutableData={true}
				suppressFlash={true}
			/>
		</div>
	);
}
