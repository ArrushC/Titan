// * 14/06/2024 11:17 AC: Removed in BranchTable.jsx where "style={{ height: calculateGridHeight(rowData) }}" was added to the div container housing AgGridReact component
export const calculateGridHeight = (rowData) => {
	const rowHeight = 25; // default row height in AG Grid
	const headerHeight = 25; // default header height in AG Grid
	return rowData.length * rowHeight + headerHeight;
};
