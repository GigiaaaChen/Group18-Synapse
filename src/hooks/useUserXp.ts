import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

let cachedXpToken: string | null = null;
let cachedXpValue = 0;
let hasCachedXp = false;
const XP_STORAGE_PREFIX = "synapse_xp_";

const readXpFromStorage = (token?: string | null) => {
	if (!token || typeof window === "undefined") return null;
	const raw = window.sessionStorage.getItem(`${XP_STORAGE_PREFIX}${token}`);
	if (raw === null) return null;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
};

const writeXpToStorage = (token: string, value: number) => {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(`${XP_STORAGE_PREFIX}${token}`, String(value));
};

const clearXpStorage = () => {
	if (typeof window === "undefined" || !cachedXpToken) return;
	window.sessionStorage.removeItem(`${XP_STORAGE_PREFIX}${cachedXpToken}`);
};

const xpListeners = new Set<(value: number) => void>();
const notifyXpListeners = (value: number) => {
	for (const listener of xpListeners) {
		listener(value);
	}
};

const getCachedXp = (token?: string | null) => {
	if (!token || !hasCachedXp || cachedXpToken !== token) return undefined;
	return cachedXpValue;
};

const setCachedXp = (token: string, value: number) => {
	cachedXpToken = token;
	cachedXpValue = value;
	hasCachedXp = true;
	writeXpToStorage(token, value);
	notifyXpListeners(value);
};

const resetCachedXp = () => {
	hasCachedXp = false;
	cachedXpToken = null;
	cachedXpValue = 0;
	notifyXpListeners(0);
};

const fetchXpFromApi = async (token: string) => {
	const res = await fetch("/api/user", {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) {
		const message = await res.text().catch(() => "Failed to fetch user");
		throw new Error(message);
	}
	const data = await res.json();
	const nextXp = data.xp || 0;
	setCachedXp(token, nextXp);
	return nextXp;
};

export const refreshUserXp = async (token?: string | null) => {
	if (!token) return;
	try {
		await fetchXpFromApi(token);
	} catch (err) {
		console.error("Failed to refresh user XP:", err);
	}
};

export const useUserXp = () => {
	const { data: session, isPending } = useSession();
	const authToken = session?.session?.token;
	const [xp, setXp] = useState<number>(() => {
		if (authToken) {
			const cached = getCachedXp(authToken);
			if (cached !== undefined) {
				return cached;
			}
			const stored = readXpFromStorage(authToken);
			if (stored !== null) {
				setCachedXp(authToken, stored);
				return stored;
			}
		} else if (hasCachedXp) {
			return cachedXpValue;
		}
		return 0;
	});

	useEffect(() => {
		const listener = (value: number) => setXp(value);
		xpListeners.add(listener);
		return () => {
			xpListeners.delete(listener);
		};
	}, []);

	useEffect(() => {
		if (isPending) return;

		if (!session) {
			clearXpStorage();
			resetCachedXp();
			setXp(0);
			return;
		}

		if (!authToken) return;

		const cached = getCachedXp(authToken);
		if (cached !== undefined) {
			setXp(cached);
		} else {
			const stored = readXpFromStorage(authToken);
			if (stored !== null) {
				setCachedXp(authToken, stored);
				setXp(stored);
			}
		}

		let isCancelled = false;

		const fetchXp = async () => {
			try {
				await fetchXpFromApi(authToken);
			} catch (err) {
				if (!isCancelled) {
					console.error("Error fetching user XP:", err);
				}
			}
		};

		fetchXp();

		return () => {
			isCancelled = true;
		};
	}, [authToken, session, isPending]);

	return xp;
};
