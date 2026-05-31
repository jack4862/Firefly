import type { AnimeItem, MusicLibraryItem } from "@/types/config";

const STORAGE_KEY = "firefly-admin-data";

export type AdminData = {
	anime: AnimeItem[];
	music: MusicLibraryItem[];
	novels: AdminNovel[];
};

export type AdminNovel = {
	id: string;
	title: string;
	author: string;
	cover: string;
	description: string;
	tags: string[];
	status: "ongoing" | "completed";
};

function getDefaultData(): AdminData {
	return { anime: [], music: [], novels: [] };
}

export function getAdminData(): AdminData {
	if (typeof window === "undefined") return getDefaultData();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return getDefaultData();
		return JSON.parse(raw);
	} catch {
		return getDefaultData();
	}
}

export function saveAdminData(data: AdminData): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAdminItems<T extends keyof AdminData>(type: T): AdminData[T] {
	return getAdminData()[type];
}

export function addAdminItem<T extends keyof AdminData>(type: T, item: AdminData[T][number]): void {
	const data = getAdminData();
	data[type].push(item as never);
	saveAdminData(data);
}

export function updateAdminItem<T extends keyof AdminData>(type: T, id: string, updates: Partial<AdminData[T][number]>): void {
	const data = getAdminData();
	const index = (data[type] as Array<{ id: string }>).findIndex((i) => i.id === id);
	if (index >= 0) {
		data[type][index] = { ...data[type][index], ...updates } as never;
		saveAdminData(data);
	}
}

export function deleteAdminItem<T extends keyof AdminData>(type: T, id: string): void {
	const data = getAdminData();
	(data[type] as Array<{ id: string }>) = (data[type] as Array<{ id: string }>).filter((i) => i.id !== id);
	saveAdminData(data);
}

export function exportAllData(): string {
	return JSON.stringify(getAdminData(), null, 2);
}

export function importData(json: string): { success: boolean; error?: string } {
	try {
		const data = JSON.parse(json);
		if (!data || typeof data !== "object") {
			return { success: false, error: "Invalid JSON format" };
		}
		const current = getAdminData();
		const merged: AdminData = {
			anime: [...current.anime, ...(data.anime || [])],
			music: [...current.music, ...(data.music || [])],
			novels: [...current.novels, ...(data.novels || [])],
		};
		saveAdminData(merged);
		return { success: true };
	} catch (e) {
		return { success: false, error: String(e) };
	}
}

export function replaceAllData(json: string): { success: boolean; error?: string } {
	try {
		const data = JSON.parse(json);
		if (!data || typeof data !== "object") {
			return { success: false, error: "Invalid JSON format" };
		}
		saveAdminData({
			anime: data.anime || [],
			music: data.music || [],
			novels: data.novels || [],
		});
		return { success: true };
	} catch (e) {
		return { success: false, error: String(e) };
	}
}

export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
