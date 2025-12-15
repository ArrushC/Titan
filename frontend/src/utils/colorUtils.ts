/**
 * Color utility functions for folder management
 * Provides random color generation and color manipulation functions
 */

// Curated color palette for folders - vibrant and distinguishable colors
const FOLDER_COLOR_PALETTE = [
	"#EF4444", // Red
	"#F97316", // Orange
	"#F59E0B", // Amber
	"#EAB308", // Yellow
	"#84CC16", // Lime
	"#22C55E", // Green
	"#10B981", // Emerald
	"#06B6D4", // Cyan
	"#0EA5E9", // Sky
	"#3B82F6", // Blue
	"#6366F1", // Indigo
	"#8B5CF6", // Violet
	"#A855F7", // Purple
	"#D946EF", // Fuchsia
	"#EC4899", // Pink
	"#F43F5E", // Rose
];

// Extended palette for more variety
const EXTENDED_COLOR_PALETTE = [
	...FOLDER_COLOR_PALETTE,
	"#DC2626", // Red 600
	"#EA580C", // Orange 600
	"#D97706", // Amber 600
	"#CA8A04", // Yellow 600
	"#65A30D", // Lime 600
	"#16A34A", // Green 600
	"#059669", // Emerald 600
	"#0891B2", // Cyan 600
	"#0284C7", // Sky 600
	"#2563EB", // Blue 600
	"#4F46E5", // Indigo 600
	"#7C3AED", // Violet 600
	"#9333EA", // Purple 600
	"#C026D3", // Fuchsia 600
	"#DB2777", // Pink 600
	"#E11D48", // Rose 600
];

/**
 * Generate a random color from the curated palette
 */
export function generateRandomColor(): string {
	const randomIndex = Math.floor(Math.random() * FOLDER_COLOR_PALETTE.length);
	const color = FOLDER_COLOR_PALETTE[randomIndex];
	if (!color) {
		throw new Error('Failed to generate random color from palette');
	}
	return color;
}

/**
 * Generate a random color from the extended palette for more variety
 */
export function generateRandomExtendedColor(): string {
	const randomIndex = Math.floor(Math.random() * EXTENDED_COLOR_PALETTE.length);
	const color = EXTENDED_COLOR_PALETTE[randomIndex];
	if (!color) {
		throw new Error('Failed to generate random color from extended palette');
	}
	return color;
}

/**
 * Generate a completely random hex color
 * Ensures good saturation and lightness for visibility
 */
export function generateRandomHexColor(): string {
	// Generate HSL values for better control over appearance
	const hue = Math.floor(Math.random() * 360);
	const saturation = Math.floor(Math.random() * 30) + 60; // 60-90% saturation
	const lightness = Math.floor(Math.random() * 20) + 45; // 45-65% lightness
	
	return hslToHex(hue, saturation, lightness);
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
	const hDecimal = h / 360;
	const sDecimal = s / 100;
	const lDecimal = l / 100;

	const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
	const x = c * (1 - Math.abs(((hDecimal * 6) % 2) - 1));
	const m = lDecimal - c / 2;

	let r = 0, g = 0, b = 0;

	if (0 <= hDecimal && hDecimal < 1/6) {
		r = c; g = x; b = 0;
	} else if (1/6 <= hDecimal && hDecimal < 2/6) {
		r = x; g = c; b = 0;
	} else if (2/6 <= hDecimal && hDecimal < 3/6) {
		r = 0; g = c; b = x;
	} else if (3/6 <= hDecimal && hDecimal < 4/6) {
		r = 0; g = x; b = c;
	} else if (4/6 <= hDecimal && hDecimal < 5/6) {
		r = x; g = 0; b = c;
	} else if (5/6 <= hDecimal && hDecimal < 1) {
		r = c; g = 0; b = x;
	}

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * Get a color that's not already in use
 * Falls back to random generation if all colors are used
 */
export function getUnusedColor(usedColors: string[]): string {
	const availableColors = EXTENDED_COLOR_PALETTE.filter(
		color => !usedColors.includes(color)
	);
	
	if (availableColors.length > 0) {
		const randomIndex = Math.floor(Math.random() * availableColors.length);
		const color = availableColors[randomIndex];
		if (!color) {
			throw new Error('Failed to get unused color from available colors');
		}
		return color;
	}
	
	// If all predefined colors are used, generate a random one
	return generateRandomHexColor();
}

/**
 * Validate if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
	const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
	return hexColorRegex.test(color);
}

/**
 * Ensure color has proper hex format
 */
export function validateAndFormatColor(color: string): string {
	// Remove any whitespace
	color = color.trim();
	
	// Add # if missing
	if (!color.startsWith('#')) {
		color = '#' + color;
	}
	
	// Validate format
	if (!isValidHexColor(color)) {
		throw new Error(`Invalid hex color format: ${color}`);
	}
	
	return color.toUpperCase();
}

/**
 * Get the default color palette
 */
export function getDefaultColorPalette(): string[] {
	return [...FOLDER_COLOR_PALETTE];
}

/**
 * Get the extended color palette
 */
export function getExtendedColorPalette(): string[] {
	return [...EXTENDED_COLOR_PALETTE];
}

/**
 * Create color with opacity suffix for background usage
 * Used with Tailwind's arbitrary value syntax
 */
export function createColorWithOpacity(color: string, opacity: string): string {
	return `${color}${opacity}`;
}

/**
 * Check if two colors are too similar (basic comparison)
 */
export function areColorsSimilar(color1: string, color2: string): boolean {
	// Simple comparison - could be enhanced with more sophisticated color distance calculation
	return color1.toLowerCase() === color2.toLowerCase();
}

/**
 * Generate a set of distinct colors
 */
export function generateDistinctColors(count: number): string[] {
	if (count <= EXTENDED_COLOR_PALETTE.length) {
		// Shuffle and take the first N colors
		const shuffled = [...EXTENDED_COLOR_PALETTE].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}
	
	// If we need more colors than we have predefined, supplement with random ones
	const colors = [...EXTENDED_COLOR_PALETTE];
	const additionalNeeded = count - EXTENDED_COLOR_PALETTE.length;
	
	for (let i = 0; i < additionalNeeded; i++) {
		let newColor;
		let attempts = 0;
		do {
			newColor = generateRandomHexColor();
			attempts++;
		} while (colors.includes(newColor) && attempts < 50);
		
		colors.push(newColor);
	}
	
	return colors;
}