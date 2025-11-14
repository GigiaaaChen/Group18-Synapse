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

const getCachedXp = (token?: string | null) => {
	if (!token || !hasCachedXp || cachedXpToken !== token) return undefined;
	return cachedXpValue;
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
				cachedXpToken = authToken;
				cachedXpValue = stored;
				hasCachedXp = true;
				return stored;
			}
		} else if (hasCachedXp) {
			return cachedXpValue;
		}
		return 0;
	});

	useEffect(() => {
		if (isPending) return;

		if (!session) {
			clearXpStorage();
			hasCachedXp = false;
			cachedXpToken = null;
			cachedXpValue = 0;
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
				cachedXpToken = authToken;
				cachedXpValue = stored;
				hasCachedXp = true;
				setXp(stored);
			}
		}

		let isCancelled = false;

		const fetchXp = async () => {
			try {
				const res = await fetch("/api/user", {
					headers: { Authorization: `Bearer ${authToken}` },
				});
				if (!res.ok) return;
				const data = await res.json();
				if (isCancelled) return;
				const nextXp = data.xp || 0;
				cachedXpToken = authToken;
				cachedXpValue = nextXp;
				hasCachedXp = true;
				writeXpToStorage(authToken, nextXp);
				setXp(nextXp);
			} catch (err) {
				console.error("Error fetching user XP:", err);
			}
		};

		fetchXp();

		return () => {
			isCancelled = true;
		};
	}, [authToken, session, isPending]);

	return xp;
};
