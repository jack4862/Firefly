import { getCollection } from "astro:content";

export type NovelMeta = {
	id: string;
	title: string;
	author: string;
	cover: string;
	description: string;
	tags: string[];
	status: "ongoing" | "completed";
	chapterCount: number;
};

export type ChapterInfo = {
	id: string;
	slug: string;
	volume: string;
	volumeName: string;
	chapter: number;
	chapterTitle: string;
};

export type VolumeGroup = {
	volume: string;
	volumeName: string;
	chapters: ChapterInfo[];
};

export async function getNovels(): Promise<NovelMeta[]> {
	const entries = await getCollection("novels");
	const novels = entries.filter((e) => e.data.type === "novel");

	return novels
		.map((novel) => {
			const novelDir = novel.id.replace(/\/meta$/, "").replace(/\/index$/, "");
			const chapterCount = entries.filter(
				(e) =>
					e.data.type === "chapter" &&
					e.id.startsWith(novelDir + "/"),
			).length;

			return {
				id: novelDir,
				title: novel.data.title,
				author: novel.data.author,
				cover: novel.data.cover,
				description: novel.data.description,
				tags: novel.data.tags,
				status: novel.data.status,
				chapterCount,
			};
		})
		.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getNovelChapters(
	novelId: string,
): Promise<ChapterInfo[]> {
	const entries = await getCollection("novels");
	const chapters = entries
		.filter(
			(e) =>
				e.data.type === "chapter" &&
				e.id.startsWith(novelId + "/") &&
				!e.id.endsWith("/meta.md") &&
				!e.id.endsWith("/meta.mdx") &&
				!e.id.endsWith("/index.md") &&
				!e.id.endsWith("/index.mdx"),
		)
		.map((e) => {
			const slug = e.id
				.replace(novelId + "/", "")
				.replace(/\.(md|mdx)$/, "");
			return {
				id: e.id,
				slug,
				volume: e.data.volume,
				volumeName: e.data.volumeName,
				chapter: e.data.chapter ?? 0,
				chapterTitle: e.data.chapterTitle,
			};
		})
		.sort((a, b) => {
			if (a.volume !== b.volume) return a.volume.localeCompare(b.volume);
			return a.chapter - b.chapter;
		});

	return chapters;
}

export async function getNovelVolumes(novelId: string): Promise<VolumeGroup[]> {
	const chapters = await getNovelChapters(novelId);
	const volumeMap = new Map<string, ChapterInfo[]>();

	for (const ch of chapters) {
		const key = ch.volume || "default";
		if (!volumeMap.has(key)) {
			volumeMap.set(key, []);
		}
		volumeMap.get(key)!.push(ch);
	}

	return Array.from(volumeMap.entries()).map(([vol, chs]) => ({
		volume: vol,
		volumeName: chs[0]?.volumeName || vol,
		chapters: chs,
	}));
}

export async function getChapterNav(
	novelId: string,
	currentChapterSlug: string,
): Promise<{ prev: ChapterInfo | null; next: ChapterInfo | null }> {
	const chapters = await getNovelChapters(novelId);
	const currentIndex = chapters.findIndex(
		(c) => c.slug === currentChapterSlug,
	);

	return {
		prev: currentIndex > 0 ? chapters[currentIndex - 1] : null,
		next:
			currentIndex < chapters.length - 1
				? chapters[currentIndex + 1]
				: null,
	};
}
