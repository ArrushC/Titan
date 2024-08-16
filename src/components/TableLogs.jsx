import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useMemo, useRef } from "react";

export default function TableLogs({ rowDataLogs, quickFilterLogsText, setAutoFillSelection = null, isAutofill = false }) {
	const defaultColDefs = useMemo(
		() => ({
			sortable: true,
			resizable: false,
			wrapText: true,
			autoHeight: true,
			filter: true,
			suppressMovable: true,
			editable: false,
			wrapHeaderText: true,
			autoHeaderHeight: true,
		}),
		[]
	);

	const colDefs = useMemo(() => {
		const commonColumns = [
			{ field: "revision", headerName: "Revision", sort: "desc", width: 100 },
			{ field: "date", headerName: "Date", width: 130, sortable: false },
			{ field: "branchFolder", headerName: "Branch Folder", width: 135 },
			{ field: "branchVersion", headerName: "Branch Version", width: 140 },
			{ field: "author", headerName: "Author" },
			{ field: "message", headerName: "Message", flex: 1 },
		];

		if (isAutofill) {
			return [
				{
					checkboxSelection: true,
					width: 20,
					resizable: false,
					suppressMovable: false,
					filter: false,
					editable: false,
					headerClass: "branch-table-header-cell",
					cellClass: "branch-table-body-cell",
				},
				...commonColumns,
			];
		}

		return commonColumns;
	}, [isAutofill]);

	const logsGridRef = useRef(null);

	const onLogsSelectionChange = useCallback(() => {
		if (setAutoFillSelection) {
			const logs = logsGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
			setAutoFillSelection(logs);
		}
	}, [setAutoFillSelection]);

	return (
		<div className="ag-theme-quartz-dark compact" style={{ height: isAutofill ? "85%" : "90%", width: "100%" }}>
			<AgGridReact
				ref={logsGridRef}
				rowData={rowDataLogs}
				defaultColDef={defaultColDefs}
				columnDefs={colDefs}
				onSelectionChanged={onLogsSelectionChange}
				quickFilterText={quickFilterLogsText}
				domLayout="normal"
				columnMenu={"new"}
				rowSelection={"single"}
				suppressRowClickSelection={true}
				animateRows={false}
				immutableData={true}
				suppressFlash={true}
				enableCellTextSelection
				ensureDomOrder
				pagination={true}
				paginationAutoPageSize={true}
			/>
		</div>
	);
}
