export function stripBranchInfo(branches = []) {
	const branchArray = !Array.isArray(branches) ? [branches] : branches;
	return branchArray.map((branch) => {
		delete branch["Branch Info"];
		return branch;
	});
}

export function toBranchString(branchFolder, branchVersion, branch) {
	return `${branchFolder == "" ? "Uncategorised" : branchFolder} ${branchVersion == "" ? "Unversioned" : branchVersion} ${String(branch).split("\\").at(-1)}`;
}

export function branchPathFolder(branch) {
	return String(branch).split("\\").at(-1);
}