import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

let cachedPetToken: string | null = null;
let cachedPetValue: any = null;
let hasCachedPet = false;
const PET_STORAGE_PREFIX = "synapse_pet_";

const readPetFromStorage = (token?: string | null) => {
  if (!token || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${PET_STORAGE_PREFIX}${token}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writePetToStorage = (token: string, value: any) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${PET_STORAGE_PREFIX}${token}`,
      JSON.stringify(value),
    );
  } catch {
    // ignore storage failures
  }
};

const clearPetStorage = () => {
  if (typeof window === "undefined" || !cachedPetToken) return;
  window.sessionStorage.removeItem(`${PET_STORAGE_PREFIX}${cachedPetToken}`);
};

const petListeners = new Set<(value: any) => void>();
const notifyPetListeners = (value: any) => {
  for (const listener of petListeners) {
    listener(value);
  }
};

export const updatePetCache = (token: string, value: any) => {
  cachedPetToken = token;
  cachedPetValue = value;
  hasCachedPet = true;
  writePetToStorage(token, value);
  notifyPetListeners(value);
};

export const clearPetCache = () => {
  hasCachedPet = false;
  cachedPetToken = null;
  cachedPetValue = null;
  clearPetStorage();
  notifyPetListeners(null);
};

const getCachedPetData = (token?: string | null) => {
  if (!token || !hasCachedPet || cachedPetToken !== token) return undefined;
  return cachedPetValue;
};

const fetchPetFromApi = async (token: string) => {
  const res = await fetch("/api/pet", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message = await res.text().catch(() => "Failed to fetch pet data");
    throw new Error(message);
  }
  const data = await res.json();
  updatePetCache(token, data);
  return data;
};

export const refreshPetData = async (token?: string | null) => {
  if (!token) return;
  try {
    await fetchPetFromApi(token);
  } catch (err) {
    console.error("Failed to refresh pet data:", err);
  }
};

export const usePetData = () => {
  const { data: session, isPending } = useSession();
  const authToken = session?.session?.token;
  const [petData, setPetData] = useState<any>(() => {
    if (authToken) {
      const cached = getCachedPetData(authToken);
      if (cached !== undefined) {
        return cached;
      }
      const stored = readPetFromStorage(authToken);
      if (stored !== null) {
        updatePetCache(authToken, stored);
        return stored;
      }
    } else if (hasCachedPet) {
      return cachedPetValue;
    }
    return null;
  });

  useEffect(() => {
    const listener = (value: any) => setPetData(value);
    petListeners.add(listener);
    return () => {
      petListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      clearPetCache();
      setPetData(null);
      return;
    }

    if (!authToken) return;

    const cached = getCachedPetData(authToken);
    if (cached !== undefined) {
      setPetData(cached);
    } else {
      const stored = readPetFromStorage(authToken);
      if (stored !== null) {
        updatePetCache(authToken, stored);
        setPetData(stored);
      }
    }

    let isCancelled = false;

    const fetchPetData = async () => {
      try {
        await fetchPetFromApi(authToken);
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching pet data:", err);
        }
      }
    };

    fetchPetData();

    return () => {
      isCancelled = true;
    };
  }, [authToken, session, isPending]);

  return petData;
};
