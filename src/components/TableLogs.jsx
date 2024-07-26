import { AgGridReact } from "ag-grid-react";
import React, { useMemo } from "react";

export default function TableLogs({ rowDataLogs, quickFilterLogsText }) {
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

	const colDefs = useMemo(
		() => [
			{ field: "revision", headerName: "Revision", sort: "desc", width: 140 },
			{ field: "branchFolder", headerName: "Branch Folder", width: 135 },
			{ field: "branchVersion", headerName: "Branch Version", width: 140 },
			{ field: "author", headerName: "Author" },
			{ field: "message", headerName: "Message", flex: 1 },
			{ field: "date", headerName: "Date", width: 130, sortable: false },
		],
		[]
	);

	return (
		<div className="ag-theme-quartz-dark compact" style={{ height: "95%", width: "100%" }}>
			<AgGridReact rowData={rowDataLogs} defaultColDef={defaultColDefs} columnDefs={colDefs} quickFilterText={quickFilterLogsText} domLayout="normal" columnMenu={"new"} animateRows={false} enableCellTextSelection ensureDomOrder />
		</div>
	);
}
