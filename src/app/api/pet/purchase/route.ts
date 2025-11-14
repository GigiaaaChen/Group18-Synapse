import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { SHOP_ITEMS } from "@/lib/pet";

export const POST = async (request: NextRequest) => {
	try {
		const user = await requireUser(request);
		const body = (await request.json()) as { itemName: string };

		if (!body.itemName) {
			return NextResponse.json(
				{ error: "Item name is required" },
				{ status: 400 },
			);
		}

		// Find item in shop catalog
		const shopItem = SHOP_ITEMS.find((item) => item.name === body.itemName);
		if (!shopItem) {
			return NextResponse.json({ error: "Item not found" }, { status: 404 });
		}

		// Get current pet data
		const petResult = await db.query(
			`SELECT coins, "equippedItems" FROM pet WHERE "userId" = $1`,
			[user.id],
		);

		if (petResult.rows.length === 0) {
			return NextResponse.json({ error: "Pet not found" }, { status: 404 });
		}

		const { coins, equippedItems } = petResult.rows[0];

		// Check if user has enough coins
		if (coins < shopItem.cost) {
			return NextResponse.json(
				{ error: "Not enough coins" },
				{ status: 400 },
			);
		}

		// Check if already owned
		const owned = equippedItems || [];
		if (owned.includes(body.itemName)) {
			return NextResponse.json(
				{ error: "Item already owned" },
				{ status: 400 },
			);
		}

		// Deduct coins and add item to equipped items
		const newEquippedItems = [...owned, body.itemName];
		const newCoins = coins - shopItem.cost;

		await db.query(
			`UPDATE pet SET coins = $1, "equippedItems" = $2 WHERE "userId" = $3`,
			[newCoins, JSON.stringify(newEquippedItems), user.id],
		);

		return NextResponse.json({
			success: true,
			coins: newCoins,
			equippedItems: newEquippedItems,
		});
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		return NextResponse.json(
			{ error: "Failed to purchase item" },
			{ status: 500 },
		);
	}
};
