import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";

export const POST = async (request: NextRequest) => {
	try {
		const user = await requireUser(request);
		const body = (await request.json()) as {
			itemName: string;
			equip: boolean;
			items?: string[]; // For bulk operations
		};

		if (!body.itemName) {
			return NextResponse.json(
				{ error: "Item name is required" },
				{ status: 400 },
			);
		}

		// Get current pet data
		const petResult = await db.query(
			`SELECT "equippedItems" FROM pet WHERE "userId" = $1`,
			[user.id],
		);

		if (petResult.rows.length === 0) {
			return NextResponse.json({ error: "Pet not found" }, { status: 404 });
		}

		const { equippedItems } = petResult.rows[0];
		const currentItems = equippedItems || [];

		let newEquippedItems: string[];

		// Handle bulk operations (debug mode)
		if (body.itemName === "all" && body.items !== undefined) {
			newEquippedItems = body.items;
		} else {
			// Check if item is owned
			if (!currentItems.includes(body.itemName)) {
				return NextResponse.json(
					{ error: "Item not owned" },
					{ status: 400 },
				);
			}

			if (body.equip) {
				// Already equipped, no change needed
				if (currentItems.includes(body.itemName)) {
					newEquippedItems = currentItems;
				} else {
					newEquippedItems = [...currentItems, body.itemName];
				}
			} else {
				// Unequip - remove from list
				newEquippedItems = currentItems.filter(
					(item: string) => item !== body.itemName,
				);
			}
		}

		await db.query(
			`UPDATE pet SET "equippedItems" = $1 WHERE "userId" = $2`,
			[JSON.stringify(newEquippedItems), user.id],
		);

		return NextResponse.json({
			success: true,
			equippedItems: newEquippedItems,
		});
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		return NextResponse.json(
			{ error: "Failed to equip/unequip item" },
			{ status: 500 },
		);
	}
};
