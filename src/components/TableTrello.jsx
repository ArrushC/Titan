import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useMemo, useRef } from "react";
import ButtonViewTrello from "./ButtonViewTrello";

export default function TableTrello({ rowDataTrello, quickFilterTrelloText, setAutoFillSelection }) {
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
			{ field: "name", headerName: "Name", flex: 1 },
			{ field: "lastActivityDate", headerName: "Last Activity Date" },
			{
				field: "url",
				headerName: "Goto Trello",
				filter: false,
				sortable: false,
				resizable: false,
				cellRenderer: ButtonViewTrello,
				width: 120,
			},
		],
		[]
	);

	const trelloGridRef = useRef(null);

	const onTrelloSelectionChange = useCallback(() => {
		const trello = trelloGridRef?.current?.api?.getSelectedNodes().map((node) => node.data);
		setAutoFillSelection(trello[0] || null);
	}, [setAutoFillSelection]);

	return (
		<div className="ag-theme-balham-dark compact" style={{ height: "80%", width: "100%" }}>
			<AgGridReact
				ref={trelloGridRef}
				rowData={rowDataTrello}
				defaultColDef={defaultColDefs}
				columnDefs={colDefs}
				onSelectionChanged={onTrelloSelectionChange}
				quickFilterText={quickFilterTrelloText}
				domLayout="normal"
				columnMenu={"new"}
				rowSelection={"single"}
				suppressRowClickSelection={false}
				animateRows={false}
				enableCellTextSelection={true}
				pagination={true}
				paginationAutoPageSize={true}
			/>
		</div>
	);
}
