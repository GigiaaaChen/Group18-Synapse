"use client";

import React from "react";
import { CoinIcon } from "./PetIcons";

interface PetStatsProps {
	level: number;
	currentXP: number;
	maxXP: number;
	percentage: number;
	coins: number;
	stage: string;
}

export const PetStats: React.FC<PetStatsProps> = ({
	level,
	currentXP,
	maxXP,
	percentage,
	coins,
	stage,
}) => {
	return (
		<div
			style={{
				background: "#161616",
				borderRadius: "16px",
				padding: "24px",
				marginBottom: "24px",
			}}
		>
			{/* Level and Stage */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "16px",
				}}
			>
				<div>
					<h3
						style={{
							fontSize: "28px",
							fontWeight: "700",
							color: "#eeeeee",
							margin: 0,
						}}
					>
						Level {level}
					</h3>
					<p
						style={{
							fontSize: "14px",
							color: "#9ca3af",
							margin: "4px 0 0 0",
							textTransform: "capitalize",
						}}
					>
						{stage} Stage
					</p>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 16px",
						background: "#1a1a1a",
						borderRadius: "8px",
					}}
				>
					<CoinIcon size={24} />
					<span
						style={{
							fontSize: "16px",
							fontWeight: "600",
							color: "#fbbf24",
						}}
					>
						{coins} coins
					</span>
				</div>
			</div>

			{/* XP Progress Bar */}
			<div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						marginBottom: "8px",
					}}
				>
					<span style={{ fontSize: "13px", color: "#9ca3af" }}>
						Experience Points
					</span>
					<span style={{ fontSize: "13px", color: "#eeeeee", fontWeight: "500" }}>
						{currentXP} / {maxXP} XP
					</span>
				</div>
				<div
					style={{
						width: "100%",
						height: "12px",
						background: "#1a1a1a",
						borderRadius: "999px",
						overflow: "hidden",
						position: "relative",
					}}
				>
					<div
						style={{
							height: "100%",
							width: `${percentage}%`,
							background: "linear-gradient(90deg, #4972e1 0%, #6366f1 100%)",
							borderRadius: "999px",
							transition: "width 0.5s ease",
						}}
					/>
				</div>
			</div>
		</div>
	);
};
