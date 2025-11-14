import React from "react";

export const CoinIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		enableBackground="new 0 0 24 24"
		viewBox="0 0 24 24"
		width={size}
		height={size}
	>
		<path
			fill="#e5cb3f"
			d="M16 11H8c-.3 0-.6-.1-.8-.4-.2-.2-.2-.5-.2-.8l1-5c.1-.5.5-.8 1-.8h6c.5 0 .9.3 1 .8l1 5c.1.3 0 .6-.2.8-.2.3-.5.4-.8.4z"
		/>
		<path
			fill="#efdf8b"
			d="M10 20H2c-.3 0-.6-.1-.8-.4s-.2-.5-.2-.8l1-5c.1-.5.5-.8 1-.8h6c.5 0 .9.3 1 .8l1 5c.1.3 0 .6-.2.8s-.5.4-.8.4zM22 20h-8c-.3 0-.6-.1-.8-.4-.2-.2-.2-.5-.2-.8l1-5c.1-.5.5-.8 1-.8h6c.5 0 .9.3 1 .8l1 5c.1.3 0 .6-.2.8-.2.3-.5.4-.8.4z"
		/>
	</svg>
);

export const SadFaceIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width={size}
		height={size}
	>
		<circle cx="12" cy="12" r="10" fill="#ef9191" />
		<path
			fill="#b91c1c"
			d="M14.999 17.092a.994.994 0 0 1-.642-.234 3.76 3.76 0 0 0-4.714 0 1 1 0 1 1-1.286-1.533 5.817 5.817 0 0 1 7.286 0 1 1 0 0 1-.644 1.767zm-5.085-6.256a.997.997 0 0 1-.707-.293 1.033 1.033 0 0 0-1.414 0 1 1 0 1 1-1.414-1.414 3.072 3.072 0 0 1 4.242 0 1 1 0 0 1-.707 1.707zm7 0a.997.997 0 0 1-.707-.293 1.033 1.033 0 0 0-1.414 0 1 1 0 0 1-1.414-1.414 3.072 3.072 0 0 1 4.242 0 1 1 0 0 1-.707 1.707z"
		/>
	</svg>
);

export const NeutralFaceIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width={size}
		height={size}
	>
		<circle cx="12" cy="12" r="10" fill="#efd091" />
		<path
			fill="#b8860b"
			d="M12 17.092a5.68 5.68 0 0 1-3.643-1.325 1 1 0 1 1 1.286-1.534 3.76 3.76 0 0 0 4.714 0 1 1 0 0 1 1.286 1.534A5.68 5.68 0 0 1 12 17.092zm-2.086-6.256a.997.997 0 0 1-.707-.293 1.033 1.033 0 0 0-1.414 0 1 1 0 1 1-1.414-1.414 3.072 3.072 0 0 1 4.242 0 1 1 0 0 1-.707 1.707zm7 0a.997.997 0 0 1-.707-.293 1.033 1.033 0 0 0-1.414 0 1 1 0 0 1-1.414-1.414 3.072 3.072 0 0 1 4.242 0 1 1 0 0 1-.707 1.707z"
		/>
	</svg>
);

export const HappyFaceIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		enableBackground="new 0 0 24 24"
		viewBox="0 0 24 24"
		width={size}
		height={size}
	>
		<path
			fill="#8ee58e"
			d="M12,2C6.47717,2,2,6.47717,2,12s4.47717,10,10,10s10-4.47717,10-10S17.52283,2,12,2z M16,14c-0.0022,2.20825-1.79175,3.9978-4,4c-2.20825-0.0022-3.9978-1.79175-4-4c-0.00031-0.55194,0.4469-0.99969,0.99884-1C8.99927,13,8.99963,13,9,13h6c0.55194-0.00031,0.99969,0.4469,1,0.99884C16,13.99927,16,13.99963,16,14z"
		/>
		<circle cx="15" cy="10" r="1" fill="#15803d" />
		<circle cx="9" cy="10" r="1" fill="#15803d" />
		<path
			fill="#15803d"
			d="M12,18c-2.20823-0.0022-3.9978-1.79177-4-4c-0.00031-0.55197,0.44689-0.99969,0.99886-1C8.99924,13,8.99962,13,9,13h6c0.55197-0.00031,0.99969,0.44689,1,0.99886c0,0.00038,0,0.00076,0,0.00114C15.9978,16.20823,14.20823,17.9978,12,18z"
		/>
	</svg>
);

export const ShopIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		enableBackground="new 0 0 24 24"
		viewBox="0 0 24 24"
		width={size}
		height={size}
	>
		<path
			fill="#87714d"
			d="M20 4H4.303a1 1 0 0 1 0-2H20a1 1 0 0 1 0 2zm-5 15v3H9v-3a3 3 0 0 1 6 0zM4 12a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1h3v4a2 2 0 0 1-2 2z"
		/>
		<path fill="#b7a994" d="M8 12a2 2 0 0 1-2-2V6h4v4a2 2 0 0 1-2 2z" />
		<path fill="#87714d" d="M12 12a2 2 0 0 1-2-2V6h4v4a2 2 0 0 1-2 2z" />
		<path fill="#b7a994" d="M16 12a2 2 0 0 1-2-2V6h4v4a2 2 0 0 1-2 2z" />
		<path
			fill="#87714d"
			d="M20 12a2 2 0 0 1-2-2V6h3a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2z"
		/>
		<path
			fill="#cfc6b7"
			d="M18 10a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-2 2v9a1 1 0 0 0 1 1h4v-3a3 3 0 1 1 6 0v3h4a1 1 0 0 0 1-1v-9a2 2 0 0 1-2-2z"
		/>
	</svg>
);

export const HappinessIcon: React.FC<{
	happiness: number;
	size?: number;
}> = ({ happiness, size = 20 }) => {
	if (happiness < 33) {
		return <SadFaceIcon size={size} />;
	}
	if (happiness < 66) {
		return <NeutralFaceIcon size={size} />;
	}
	return <HappyFaceIcon size={size} />;
};
