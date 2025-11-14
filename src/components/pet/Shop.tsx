"use client";

import React, { useState } from "react";
import { SHOP_ITEMS } from "@/lib/pet";
import { CoinIcon } from "./PetIcons";

interface ShopProps {
	coins: number;
	equippedItems: string[];
	onPurchase: (itemName: string) => Promise<void>;
	onClose: () => void;
}

export const Shop: React.FC<ShopProps> = ({
	coins,
	equippedItems,
	onPurchase,
	onClose,
}) => {
	const [purchasing, setPurchasing] = useState<string | null>(null);
	const [hoveredItem, setHoveredItem] = useState<string | null>(null);

	const handlePurchase = async (itemName: string, cost: number) => {
		if (coins < cost) return;
		if (equippedItems.includes(itemName)) return;

		setPurchasing(itemName);
		try {
			await onPurchase(itemName);
		} finally {
			setPurchasing(null);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: "rgba(0, 0, 0, 0.8)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
				padding: "20px",
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: "#161616",
					borderRadius: "24px",
					padding: "32px",
					maxWidth: "800px",
					width: "100%",
					maxHeight: "80vh",
					overflow: "auto",
					position: "relative",
				}}
				onClick={(e) => e.stopPropagation()}
			>	
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "24px",
					}}
				>
					<h2
						style={{
							fontSize: "24px",
							fontWeight: "700",
							color: "#eeeeee",
							margin: 0,
						}}
					>
						Pet Shop
					</h2>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "12px",
						}}
					>
						<div
							style={{
								padding: "8px 16px",
								background: "#1a1a1a",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<CoinIcon size={24} />
							<span
								style={{
									fontSize: "18px",
									fontWeight: "600",
									color: "#fbbf24",
								}}
							>
								{coins}
							</span>
						</div>
						<button
							onClick={onClose}
							style={{
								background: "none",
								border: "none",
								color: "#9ca3af",
								fontSize: "28px",
								cursor: "pointer",
								padding: "0 8px",
								lineHeight: 1,
							}}
						>
							×
						</button>
					</div>
				</div>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
						gap: "16px",
					}}
				>
					{SHOP_ITEMS.map((item) => {
						const isOwned = equippedItems.includes(item.name);
						const canAfford = coins >= item.cost;
						const isHovered = hoveredItem === item.name;

						return (
							<div
								key={item.name}
								onMouseEnter={() => setHoveredItem(item.name)}
								onMouseLeave={() => setHoveredItem(null)}
								style={{
									background: isHovered ? "#1a1a1a" : "#0a0a0a",
									borderRadius: "12px",
									padding: "16px",
									border: `2px solid ${isOwned ? "#10b981" : "#2a2a2a"}`,
									transition: "all 0.2s ease",
									opacity: isOwned ? 0.7 : 1,
									position: "relative",
								}}
							>
								<div
									style={{
										width: "100%",
										height: "120px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										marginBottom: "12px",
										position: "relative",
									}}
								>
									<img
										src="/static/images/tamagotchi.png"
										alt="Base pet"
										style={{
											position: "absolute",
											width: "100%",
											height: "100%",
											objectFit: "contain",
											opacity: 0.15,
											pointerEvents: "none",
										}}
									/>
									<img
										src={item.image}
										alt={item.displayName}
										style={{
											maxWidth: "100%",
											maxHeight: "100%",
											objectFit: "contain",
											filter: isOwned
												? "saturate(1.3) brightness(1.1)"
												: !canAfford
													? "grayscale(1)"
													: "saturate(1.3) brightness(1.1)",
											position: "relative",
											zIndex: 1,
										}}
									/>
									{isOwned && (
										<div
											style={{
												position: "absolute",
												top: "8px",
												right: "8px",
												background: "#10b981",
												color: "#fff",
												padding: "4px 8px",
												borderRadius: "6px",
												fontSize: "11px",
												fontWeight: "600",
												zIndex: 2,
											}}
										>
											Owned
										</div>
									)}
								</div>

								<h3
									style={{
										fontSize: "14px",
										fontWeight: "600",
										color: "#eeeeee",
										margin: "0 0 8px 0",
										textAlign: "center",
									}}
								>
									{item.displayName}
								</h3>

								<button
									onClick={() => handlePurchase(item.name, item.cost)}
									disabled={isOwned || !canAfford || purchasing === item.name}
									style={{
										width: "100%",
										padding: "8px 12px",
										borderRadius: "8px",
										border: "none",
										background: isOwned
											? "#2a2a2a"
											: canAfford
												? "#fbbf24"
												: "#3a3a3a",
										color: isOwned ? "#666" : canAfford ? "#1a1a1a" : "#666",
										fontSize: "13px",
										fontWeight: "600",
										cursor: isOwned || !canAfford ? "not-allowed" : "pointer",
										transition: "all 0.2s ease",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: "4px",
									}}
								>
									{purchasing === item.name ? (
										"Purchasing..."
									) : isOwned ? (
										"Owned"
									) : (
										<>
											<CoinIcon size={16} />
											<span>{item.cost}</span>
										</>
									)}
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
