// Branch configuration validation and sanitization utilities

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface BranchConfigData {
	folders: Record<string, {
		color: string;
		branchIds: string[];
		order?: number;
	}>;
	branches: Record<string, {
		branchVersion: string;
		branchPath: string;
	}>;
}

/**
 * Validates the structure and content of a branch configuration JSON
 */
export function validateBranchConfig(jsonContent: string): ValidationResult {
	const result: ValidationResult = {
		isValid: true,
		errors: [],
		warnings: []
	};

	try {
		const config: BranchConfigData = JSON.parse(jsonContent);

		// Validate top-level structure
		if (typeof config !== 'object' || config === null) {
			result.errors.push('Configuration must be an object');
			result.isValid = false;
			return result;
		}

		if (!config.folders || typeof config.folders !== 'object') {
			result.errors.push('Missing or invalid "folders" property');
			result.isValid = false;
		}

		if (!config.branches || typeof config.branches !== 'object') {
			result.errors.push('Missing or invalid "branches" property');
			result.isValid = false;
		}

		if (!result.isValid) {
			return result;
		}

		// Validate folders
		const allBranchIds = new Set<string>();

		for (const [folderName, folder] of Object.entries(config.folders)) {
			// Validate folder name
			if (!folderName || folderName.trim() === '') {
				result.errors.push('Folder names cannot be empty');
				result.isValid = false;
			}

			// Validate folder structure
			if (typeof folder !== 'object' || folder === null) {
				result.errors.push(`Folder "${folderName}" must be an object`);
				result.isValid = false;
				continue;
			}

			// Validate color property
			if (typeof folder.color !== 'string') {
				result.errors.push(`Folder "${folderName}" missing or invalid color property`);
				result.isValid = false;
			} else if (!/^#[0-9A-Fa-f]{6}$/.test(folder.color)) {
				result.warnings.push(`Folder "${folderName}" color "${folder.color}" is not a valid hex color`);
			}

			// Validate branchIds array
			if (!Array.isArray(folder.branchIds)) {
				result.errors.push(`Folder "${folderName}" branchIds must be an array`);
				result.isValid = false;
			} else {
				for (const branchId of folder.branchIds) {
					if (typeof branchId !== 'string') {
						result.errors.push(`Folder "${folderName}" contains non-string branch ID`);
						result.isValid = false;
					} else {
						if (allBranchIds.has(branchId)) {
							result.errors.push(`Branch ID "${branchId}" appears in multiple folders`);
							result.isValid = false;
						}
						allBranchIds.add(branchId);
					}
				}
			}

			// Validate order property (optional)
			if (folder.order !== undefined && typeof folder.order !== 'number') {
				result.warnings.push(`Folder "${folderName}" order property should be a number`);
			}
		}

		// Validate branches
		const definedBranchIds = new Set(Object.keys(config.branches));

		for (const [branchId, branch] of Object.entries(config.branches)) {
			// Validate branch ID
			if (!branchId || branchId.trim() === '') {
				result.errors.push('Branch IDs cannot be empty');
				result.isValid = false;
			}

			// Validate branch structure
			if (typeof branch !== 'object' || branch === null) {
				result.errors.push(`Branch "${branchId}" must be an object`);
				result.isValid = false;
				continue;
			}

			// Validate branchVersion
			if (typeof branch.branchVersion !== 'string') {
				result.errors.push(`Branch "${branchId}" missing or invalid branchVersion property`);
				result.isValid = false;
			} else if (branch.branchVersion.trim() === '') {
				result.warnings.push(`Branch "${branchId}" has empty branchVersion`);
			}

			// Validate branchPath
			if (typeof branch.branchPath !== 'string') {
				result.errors.push(`Branch "${branchId}" missing or invalid branchPath property`);
				result.isValid = false;
			} else if (branch.branchPath.trim() === '') {
				result.warnings.push(`Branch "${branchId}" has empty branchPath`);
			}
		}

		// Check for orphaned branches (in folders but not defined)
		for (const branchId of allBranchIds) {
			if (!definedBranchIds.has(branchId)) {
				result.errors.push(`Branch "${branchId}" is referenced in folders but not defined in branches`);
				result.isValid = false;
			}
		}

		// Check for unused branches (defined but not in any folder)
		for (const branchId of definedBranchIds) {
			if (!allBranchIds.has(branchId)) {
				result.warnings.push(`Branch "${branchId}" is defined but not assigned to any folder`);
			}
		}

		// Check for duplicate branch versions within the same path group
		const versionGroups = new Map<string, Set<string>>();
		for (const branch of Object.values(config.branches)) {
			const pathSegment = getLastPathSegment(branch.branchPath);
			if (!versionGroups.has(pathSegment)) {
				versionGroups.set(pathSegment, new Set());
			}
			const versions = versionGroups.get(pathSegment)!;
			if (versions.has(branch.branchVersion)) {
				result.warnings.push(`Duplicate branch version "${branch.branchVersion}" found in path group "${pathSegment}"`);
			}
			versions.add(branch.branchVersion);
		}

	} catch (error) {
		result.errors.push('Invalid JSON format: ' + (error instanceof Error ? error.message : 'Unknown error'));
		result.isValid = false;
	}

	return result;
}

/**
 * Sanitizes and normalizes branch configuration data
 */
export function sanitizeBranchConfig(jsonContent: string): string {
	try {
		const config: BranchConfigData = JSON.parse(jsonContent);

		// Sanitize folders
		if (config.folders) {
			for (const folder of Object.values(config.folders)) {
				// Ensure branchIds is an array
				if (!Array.isArray(folder.branchIds)) {
					folder.branchIds = [];
				}

				// Remove duplicate branch IDs
				folder.branchIds = [...new Set(folder.branchIds.filter(id => typeof id === 'string'))];

				// Normalize color format
				if (typeof folder.color === 'string' && folder.color.startsWith('#')) {
					folder.color = folder.color.toUpperCase();
				}

				// Ensure order is a number if present
				if (folder.order !== undefined && typeof folder.order !== 'number') {
					delete folder.order;
				}
			}
		}

		// Sanitize branches
		if (config.branches) {
			for (const branch of Object.values(config.branches)) {
				// Trim whitespace from strings
				if (typeof branch.branchVersion === 'string') {
					branch.branchVersion = branch.branchVersion.trim();
				}
				if (typeof branch.branchPath === 'string') {
					branch.branchPath = branch.branchPath.trim();
				}
			}
		}

		// Return formatted JSON
		return JSON.stringify(config, null, 2);
	} catch (error) {
		// If parsing fails, return original content
		return jsonContent;
	}
}

/**
 * Helper function to extract the last path segment from a branch path
 */
function getLastPathSegment(path: string): string {
	if (!path || path.trim() === '') {
		return '';
	}

	// Normalize path by removing trailing slashes
	const normalizedPath = path.replace(/[\\/]+$/, '');

	// Split by both Windows and Unix separators and get the last segment
	const segments = normalizedPath.split(/[\\/]/);
	const lastSegment = segments[segments.length - 1];

	return lastSegment || '';
}

/**
 * Formats validation results into a human-readable message
 */
export function formatValidationMessage(result: ValidationResult): string {
	let message = '';

	if (result.errors.length > 0) {
		message += 'Errors:\n' + result.errors.map(error => `• ${error}`).join('\n');
	}

	if (result.warnings.length > 0) {
		if (message) message += '\n\n';
		message += 'Warnings:\n' + result.warnings.map(warning => `• ${warning}`).join('\n');
	}

	return message || 'Configuration is valid';
}