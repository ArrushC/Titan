import { DragHandleIcon } from "@chakra-ui/icons";
import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../AppContext";
import { Flex } from "@chakra-ui/react";
import { stripBranchInfo } from "../utils/CommonConfig";
import useWindowDimensions from "../hooks/useWindowDimensions";
import { RiFilePaper2Fill } from "react-icons/ri";
import ButtonElectron from "./ButtonElectron";
import { MdAutoFixHigh } from "react-icons/md";

export default function TableBranches({ rowData, onRowValueChanged, refreshAll }) {
	const { config, branchTableGridRef, updateConfig, isDebug, selectedBranches, setSelectedBranches, setSelectedBranchStatuses, customScripts, setShowCommitView } = useApp();
	const windowDimensions = useWindowDimensions();
	const [isTallScreen, setIsTallScreen] = useState(windowDimensions.height > 768);

	const resolveConflicts = useCallback((branchData) => {
		window.electron.openSvnResolve({ fullPath: branchData["SVN Branch"] }).then((result) => {
			console.log("Resolve Conflict Result: ", JSON.stringify(result, null, 4));
			refreshAll(true);
		});
	}, [refreshAll]);

	const executeCustomScript = useCallback((scriptType, scriptPath, branchData) => {
		window.electron.runCustomScript({ scriptType, scriptPath, branchData }).then((result) => {
			console.log("Custom Script Result: ", JSON.stringify(result, null, 4));
		});
	}, []);

	const copyRow = useCallback(
		(currentRowData) => {
			const newRow = {
				...currentRowData,
				id: String(Date.now()),
				"Branch Info": "Copied",
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

	const colDefs = useMemo(() => {
		const commonColDefs = [
			{ headerCheckboxSelection: true, checkboxSelection: true, headerCheckboxSelectionFilteredOnly: true, width: 25, resizable: false, suppressMovable: false, filter: false, editable: false, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" },
			{ field: "Branch Folder", resizable: false, width: 130, valueFormatter: (params) => params.value.toUpperCase() },
			{ field: "Branch Version", resizable: false, width: 130 },
			{ field: "SVN Branch", flex: 1.5 },
			{ field: "Branch Info", editable: false, resizable: false, width: 150 },
			{
				headerName: "",
				flex: 0.50,
				resizable: true,
				sortable: false,
				filter: false,
				editable: false,
				cellRenderer: (params) => (
					<Flex columnGap={1}>
						{String(params.data["Branch Info"]).toLowerCase().includes("🤬") ? (
							<ButtonElectron icon={<MdAutoFixHigh />} onClick={() => resolveConflicts(params.data)} colorScheme={"yellow"} label="Resolve Conflicts" size="sm" />
						) : null}
						{customScripts.map((script, i) => (
							<ButtonElectron key={i} icon={<RiFilePaper2Fill />} onClick={() => executeCustomScript(script.type, script.path, params.data)} colorScheme={"yellow"} label={script.fileName} size="sm" />
						))}
						{/* <Tooltip label="Copy Row" placement="top" hasArrow>
							<ButtonIconTooltip icon={<CopyIcon />} onClick={() => copyRow(params.data)} colorScheme={"yellow"} label="Copy Row" size="sm" />
						</Tooltip> */}
					</Flex>
				),
			},
		];

		return isTallScreen ? [{ field: "", rowDrag: true, resizable: false, filter: false, suppressMovable: false, editable: false, width: 20, cellRenderer: DragHandleIcon, headerClass: "branch-table-header-cell", cellClass: "branch-table-body-cell" }, ...commonColDefs] : commonColDefs;
	}, [isTallScreen, customScripts, copyRow]);

	useEffect(() => {
		setIsTallScreen(windowDimensions.height > 768);
	}, [windowDimensions]);

	return (
		<div className="ag-theme-balham-dark compact" style={{ height: isTallScreen ? "auto" : "428px", width: "100%" }}>
			<AgGridReact
				ref={branchTableGridRef}
				rowData={rowData}
				defaultColDef={defaultColDef}
				columnDefs={colDefs}
				stopEditingWhenCellsLoseFocus={true}
				getRowStyle={getRowStyle}
				onRowDragEnd={onRowDragEnd}
				domLayout={isTallScreen ? "autoHeight" : "normal"}
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
				enableCellTextSelection={true}
				ensureDomOrder
				pagination={!isTallScreen}
				paginationAutoPageSize={false}
				paginationPageSizeSelector={false}
				paginationPageSize={10}
			/>
		</div>
	);
}
