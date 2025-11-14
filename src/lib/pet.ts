// LLM used for utility functions
/**
 * Pet utility functions for level, XP, and stage calculations
 */

export interface LevelProgress {
	level: number;
	currentXP: number;
	maxXP: number;
	percentage: number;
}

export type PetStage = "baby" | "teen" | "adult" | "master";

/**
 * Calculate level from XP
 * Every 100 XP = 1 level
 */
export const getLevel = (xp: number): number => {
	return Math.floor(xp / 100) + 1;
};

/**
 * Get current level progress
 */
export const getLevelProgress = (xp: number): LevelProgress => {
	const currentXP = xp % 100;
	return {
		level: getLevel(xp),
		currentXP,
		maxXP: 100,
		percentage: (currentXP / 100) * 100,
	};
};

/**
 * Determine pet stage based on level
 */
export const getPetStage = (level: number): PetStage => {
	if (level < 5) return "baby";
	if (level < 10) return "teen";
	if (level < 20) return "adult";
	return "master";
};

/**
 * Calculate rewards for task completion
 * Can be extended later for time-based bonuses
 */
export const calculateTaskRewards = (task: {
	isGoal: boolean;
	goalFrequency: "daily" | "weekly" | null;
	dueDate: string | null;
}): { xp: number; coins: number } => {
	// Base rewards
	let xp = 10;
	let coins = 1;

	// Weekly goal bonus
	if (task.isGoal && task.goalFrequency === "weekly") {
		xp = 30;
		coins = 3;
	}

	// Late penalty for XP (coins stay the same)
	if (task.dueDate && !task.isGoal) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const due = new Date(task.dueDate);
		due.setHours(0, 0, 0, 0);

		if (today > due) {
			xp = 5; // Late penalty
		}
	}

	return { xp, coins };
};

/**
 * Shop item definition
 */
export interface ShopItem {
	name: string;
	type: "hat" | "shirt" | "scarf" | "accessory" | "shoes" | "bottom" | "held";
	displayName: string;
	cost: number;
	image: string;
}

/**
 * Hardcoded shop catalog
 */
export const SHOP_ITEMS: ShopItem[] = [
	{
		name: "yellowhat",
		type: "hat",
		displayName: "Yellow Hat",
		cost: 5,
		image: "/static/images/yellowhat.png",
	},
	{
		name: "brownscarf",
		type: "scarf",
		displayName: "Brown Scarf",
		cost: 8,
		image: "/static/images/brownscarf.png",
	},
	{
		name: "pinkscarf",
		type: "scarf",
		displayName: "Pink Scarf",
		cost: 8,
		image: "/static/images/pinkscarf.png",
	},
	{
		name: "blueshirt",
		type: "shirt",
		displayName: "Blue Shirt",
		cost: 10,
		image: "/static/images/blueshirt.png",
	},
	{
		name: "pinkskirt",
		type: "bottom",
		displayName: "Pink Skirt",
		cost: 12,
		image: "/static/images/pinkskirt.png",
	},
	{
		name: "bowtie",
		type: "accessory",
		displayName: "Bow Tie",
		cost: 15,
		image: "/static/images/bowtie.png",
	},
	{
		name: "bunnyslippers",
		type: "shoes",
		displayName: "Bunny Slippers",
		cost: 15,
		image: "/static/images/bunnyslippers.png",
	},
	{
		name: "sunglasses",
		type: "accessory",
		displayName: "Sunglasses",
		cost: 20,
		image: "/static/images/sunglasses.png",
	},
	{
		name: "popsicle",
		type: "held",
		displayName: "Popsicle",
		cost: 5,
		image: "/static/images/popsicle.png",
	},
];
