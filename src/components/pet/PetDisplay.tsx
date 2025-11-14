"use client";

import React from "react";

interface PetDisplayProps {
	equippedItems: string[];
	stage: string;
	size?: number;
}

export const PetDisplay: React.FC<PetDisplayProps> = ({
	equippedItems,
	stage,
	size = 300,
}) => {
	return (
		<div
			style={{
				position: "relative",
				width: `${size}px`,
				height: `${size}px`,
				margin: "0 auto",
			}}
		>
			{/* Base Tamagotchi */}
			<img
				src="/static/images/tamagotchi.png"
				alt="Tamagotchi"
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					objectFit: "contain",
				}}
			/>

			{/* Layer equipped items in specific order (bottom to top) */}
			{/* Layer 1: Bottom items (skirt) */}
			{equippedItems.includes("pinkskirt") && (
				<img
					src="/static/images/pinkskirt.png"
					alt="pinkskirt"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 1,
					}}
				/>
			)}

			{/* Layer 2: Shirts */}
			{equippedItems.includes("blueshirt") && (
				<img
					src="/static/images/blueshirt.png"
					alt="blueshirt"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 2,
					}}
				/>
			)}

			{/* Layer 3: Scarves (above shirt) */}
			{equippedItems.includes("brownscarf") && (
				<img
					src="/static/images/brownscarf.png"
					alt="brownscarf"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 3,
					}}
				/>
			)}
			{equippedItems.includes("pinkscarf") && (
				<img
					src="/static/images/pinkscarf.png"
					alt="pinkscarf"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 3,
					}}
				/>
			)}

			{/* Layer 4: Shoes */}
			{equippedItems.includes("bunnyslippers") && (
				<img
					src="/static/images/bunnyslippers.png"
					alt="bunnyslippers"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 4,
					}}
				/>
			)}

			{/* Layer 5: Popsicle */}
			{equippedItems.includes("popsicle") && (
				<img
					src="/static/images/popsicle.png"
					alt="popsicle"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 5,
					}}
				/>
			)}

			{/* Layer 6: Hats */}
			{equippedItems.includes("yellowhat") && (
				<img
					src="/static/images/yellowhat.png"
					alt="yellowhat"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 6,
					}}
				/>
			)}

			{/* Layer 7: Sunglasses (above hat) */}
			{equippedItems.includes("sunglasses") && (
				<img
					src="/static/images/sunglasses.png"
					alt="sunglasses"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 7,
					}}
				/>
			)}

			{/* Layer 8: Bowtie (topmost) */}
			{equippedItems.includes("bowtie") && (
				<img
					src="/static/images/bowtie.png"
					alt="bowtie"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						pointerEvents: "none",
						zIndex: 8,
					}}
				/>
			)}

			{/* Optional: Stage-based glow effect */}
			{stage === "master" && (
				<div
					style={{
						position: "absolute",
						top: "-10%",
						left: "-10%",
						width: "120%",
						height: "120%",
						background:
							"radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
						pointerEvents: "none",
						animation: "pulse 2s ease-in-out infinite",
					}}
				/>
			)}
		</div>
	);
};
