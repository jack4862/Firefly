<script lang="ts">
import { onMount } from "svelte";
import {
	getAdminData,
	saveAdminData,
	addAdminItem,
	updateAdminItem,
	deleteAdminItem,
	exportAllData,
	importData,
	replaceAllData,
	generateId,
	type AdminData,
	type AdminNovel,
} from "@/utils/admin-storage";
import type { AnimeItem, AnimeStatus, MusicLibraryItem } from "@/types/config";

let activeTab = $state<"anime" | "music" | "novels">("anime");
let adminData = $state<AdminData>({ anime: [], music: [], novels: [] });
let editingId = $state<string | null>(null);
let showForm = $state(false);
let importText = $state("");
let showImport = $state(false);
let message = $state("");
let messageType = $state<"success" | "error">("success");

let animeForm = $state({
	title: "",
	titleJa: "",
	cover: "",
	synopsis: "",
	rating: 0,
	status: "plan-to-watch" as AnimeStatus,
	year: new Date().getFullYear(),
	tags: "",
	episodesWatched: 0,
	episodesTotal: 0,
	link: "",
});

let musicForm = $state({
	title: "",
	artist: "",
	album: "",
	cover: "",
	tags: "",
	url: "",
	lrc: "",
	sourceLink: "",
	duration: "",
	description: "",
});

let novelForm = $state({
	title: "",
	author: "",
	cover: "",
	description: "",
	tags: "",
	status: "ongoing" as "ongoing" | "completed",
});

onMount(() => {
	adminData = getAdminData();
});

function showMessage(msg: string, type: "success" | "error" = "success") {
	message = msg;
	messageType = type;
	setTimeout(() => { message = ""; }, 3000);
}

function resetForm() {
	editingId = null;
	animeForm = { title: "", titleJa: "", cover: "", synopsis: "", rating: 0, status: "plan-to-watch", year: new Date().getFullYear(), tags: "", episodesWatched: 0, episodesTotal: 0, link: "" };
	musicForm = { title: "", artist: "", album: "", cover: "", tags: "", url: "", lrc: "", sourceLink: "", duration: "", description: "" };
	novelForm = { title: "", author: "", cover: "", description: "", tags: "", status: "ongoing" };
}

function openForm() {
	resetForm();
	showForm = true;
}

function editItem(id: string) {
	editingId = id;
	showForm = true;
	if (activeTab === "anime") {
		const item = adminData.anime.find((a) => a.id === id);
		if (item) {
			animeForm = {
				title: item.title,
				titleJa: item.titleJa || "",
				cover: item.cover,
				synopsis: item.synopsis || "",
				rating: item.rating || 0,
				status: item.status,
				year: item.year || 0,
				tags: (item.tags || []).join(", "),
				episodesWatched: item.episodes?.watched || 0,
				episodesTotal: item.episodes?.total || 0,
				link: item.link || "",
			};
		}
	} else if (activeTab === "music") {
		const item = adminData.music.find((m) => m.id === id);
		if (item) {
			musicForm = {
				title: item.title,
				artist: item.artist,
				album: item.album || "",
				cover: item.cover,
				tags: (item.tags || []).join(", "),
				url: item.url,
				lrc: item.lrc || "",
				sourceLink: item.sourceLink || "",
				duration: item.duration || "",
				description: item.description || "",
			};
		}
	} else if (activeTab === "novels") {
		const item = adminData.novels.find((n) => n.id === id);
		if (item) {
			novelForm = {
				title: item.title,
				author: item.author,
				cover: item.cover,
				description: item.description,
				tags: (item.tags || []).join(", "),
				status: item.status,
			};
		}
	}
}

function saveItem() {
	if (activeTab === "anime") {
		const item: AnimeItem = {
			id: editingId || generateId(),
			title: animeForm.title,
			titleJa: animeForm.titleJa || undefined,
			cover: animeForm.cover,
			synopsis: animeForm.synopsis || undefined,
			rating: animeForm.rating || undefined,
			status: animeForm.status,
			year: animeForm.year || undefined,
			tags: animeForm.tags ? animeForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
			episodes: animeForm.episodesTotal > 0 ? { watched: animeForm.episodesWatched, total: animeForm.episodesTotal } : undefined,
			link: animeForm.link || undefined,
		};
		if (editingId) {
			updateAdminItem("anime", editingId, item);
		} else {
			addAdminItem("anime", item);
		}
	} else if (activeTab === "music") {
		const item: MusicLibraryItem = {
			id: editingId || generateId(),
			title: musicForm.title,
			artist: musicForm.artist,
			album: musicForm.album || undefined,
			cover: musicForm.cover,
			tags: musicForm.tags ? musicForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
			url: musicForm.url,
			lrc: musicForm.lrc || undefined,
			sourceLink: musicForm.sourceLink || undefined,
			duration: musicForm.duration || undefined,
			description: musicForm.description || undefined,
		};
		if (editingId) {
			updateAdminItem("music", editingId, item);
		} else {
			addAdminItem("music", item);
		}
	} else if (activeTab === "novels") {
		const item: AdminNovel = {
			id: editingId || generateId(),
			title: novelForm.title,
			author: novelForm.author,
			cover: novelForm.cover,
			description: novelForm.description,
			tags: novelForm.tags ? novelForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
			status: novelForm.status,
		};
		if (editingId) {
			updateAdminItem("novels", editingId, item);
		} else {
			addAdminItem("novels", item);
		}
	}

	adminData = getAdminData();
	showForm = false;
	resetForm();
	showMessage(editingId ? "已更新" : "已添加");
}

function removeItem(id: string) {
	if (!confirm("确定要删除吗？")) return;
	deleteAdminItem(activeTab, id);
	adminData = getAdminData();
	showMessage("已删除");
}

function handleExport() {
	const json = exportAllData();
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `firefly-admin-data-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
	showMessage("已导出");
}

function handleImport() {
	if (!importText.trim()) return;
	const result = importData(importText);
	if (result.success) {
		adminData = getAdminData();
		showImport = false;
		importText = "";
		showMessage("已导入");
	} else {
		showMessage(result.error || "导入失败", "error");
	}
}

function handleFileImport(e: Event) {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = () => {
		importText = reader.result as string;
		handleImport();
	};
	reader.readAsText(file);
	input.value = "";
}

const animeStatuses: { value: AnimeStatus; label: string }[] = [
	{ value: "watching", label: "在看" },
	{ value: "completed", label: "看完" },
	{ value: "on-hold", label: "搁置" },
	{ value: "dropped", label: "抛弃" },
	{ value: "plan-to-watch", label: "想看" },
];

const novelStatuses = [
	{ value: "ongoing", label: "连载中" },
	{ value: "completed", label: "已完结" },
];

let currentItems = $derived(
	activeTab === "anime" ? adminData.anime :
	activeTab === "music" ? adminData.music :
	adminData.novels
);
</script>

<div class="admin-panel">
  <!-- Message toast -->
  {#if message}
    <div class="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300"
         class:bg-green-500={messageType === "success"}
         class:bg-red-500={messageType === "error"}
         class:text-white={true}>
      {message}
    </div>
  {/if}

  <!-- Top bar -->
  <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
    <div class="flex items-center gap-2">
      <button onclick={handleExport}
              class="btn-regular px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        导出JSON
      </button>
      <button onclick={() => { showImport = !showImport; }}
              class="btn-regular px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        导入JSON
      </button>
    </div>
    <button onclick={openForm}
            class="btn-regular px-4 py-1.5 rounded-lg text-sm font-medium bg-(--primary) text-white hover:bg-(--primary) flex items-center gap-1.5">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      添加
    </button>
  </div>

  <!-- Import panel -->
  {#if showImport}
    <div class="mb-6 p-4 rounded-xl bg-(--btn-regular-bg) border border-(--line-divider)">
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-3">粘贴 JSON 数据或上传文件：</p>
      <textarea bind:value={importText}
                class="w-full h-32 p-3 rounded-lg bg-(--card-bg) border border-(--line-divider) text-sm font-mono resize-y mb-3"
                placeholder="粘贴 JSON 数据..."></textarea>
      <div class="flex items-center gap-3">
        <button onclick={handleImport}
                class="btn-regular px-4 py-1.5 rounded-lg text-sm font-medium bg-(--primary) text-white">
          确认导入
        </button>
        <label class="btn-regular px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer">
          上传文件
          <input type="file" accept=".json" onchange={handleFileImport} class="hidden" />
        </label>
        <button onclick={() => { showImport = false; importText = ""; }}
                class="btn-regular px-3 py-1.5 rounded-lg text-sm">取消</button>
      </div>
    </div>
  {/if}

  <!-- Tabs -->
  <div class="flex gap-1 mb-6 p-1 rounded-xl bg-(--btn-regular-bg)">
    <button onclick={() => { activeTab = "anime"; showForm = false; resetForm(); }}
            class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            class:bg-(--card-bg)={activeTab === "anime"}
            class:shadow-sm={activeTab === "anime"}
            class:text-(--primary)={activeTab === "anime"}>
      动画收藏 ({adminData.anime.length})
    </button>
    <button onclick={() => { activeTab = "music"; showForm = false; resetForm(); }}
            class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            class:bg-(--card-bg)={activeTab === "music"}
            class:shadow-sm={activeTab === "music"}
            class:text-(--primary)={activeTab === "music"}>
      音乐库 ({adminData.music.length})
    </button>
    <button onclick={() => { activeTab = "novels"; showForm = false; resetForm(); }}
            class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            class:bg-(--card-bg)={activeTab === "novels"}
            class:shadow-sm={activeTab === "novels"}
            class:text-(--primary)={activeTab === "novels"}>
      小说 ({adminData.novels.length})
    </button>
  </div>

  <!-- Form -->
  {#if showForm}
    <div class="mb-6 p-5 rounded-xl bg-(--card-bg) border border-(--line-divider)">
      <h3 class="text-lg font-bold mb-4">{editingId ? "编辑" : "添加"}{activeTab === "anime" ? "动画" : activeTab === "music" ? "音乐" : "小说"}</h3>

      {#if activeTab === "anime"}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">标题 *</label>
            <input bind:value={animeForm.title} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">日文标题</label>
            <input bind:value={animeForm.titleJa} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">封面URL *</label>
            <input bind:value={animeForm.cover} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="https://..." />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">外部链接</label>
            <input bind:value={animeForm.link} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="https://myanimelist.net/..." />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">状态</label>
            <select bind:value={animeForm.status} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm">
              {#each animeStatuses as s}
                <option value={s.value}>{s.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">评分 (1-10)</label>
            <input type="number" min="0" max="10" bind:value={animeForm.rating} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">年份</label>
            <input type="number" bind:value={animeForm.year} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">标签 (逗号分隔)</label>
            <input bind:value={animeForm.tags} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="奇幻, 冒险" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">已看集数</label>
            <input type="number" min="0" bind:value={animeForm.episodesWatched} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">总集数</label>
            <input type="number" min="0" bind:value={animeForm.episodesTotal} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-sm text-neutral-500 mb-1 block">简介</label>
            <textarea bind:value={animeForm.synopsis} rows="3" class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm resize-y"></textarea>
          </div>
        </div>

      {:else if activeTab === "music"}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">歌曲名 *</label>
            <input bind:value={musicForm.title} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">艺术家 *</label>
            <input bind:value={musicForm.artist} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">专辑</label>
            <input bind:value={musicForm.album} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">封面URL *</label>
            <input bind:value={musicForm.cover} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="https://..." />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">音频URL *</label>
            <input bind:value={musicForm.url} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="/music/song.mp3 或 https://..." />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">歌词URL</label>
            <input bind:value={musicForm.lrc} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="/music/song.lrc" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">标签 (逗号分隔)</label>
            <input bind:value={musicForm.tags} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="pop, jpop" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">时长</label>
            <input bind:value={musicForm.duration} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="4:32" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">外部链接</label>
            <input bind:value={musicForm.sourceLink} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="https://..." />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">描述</label>
            <input bind:value={musicForm.description} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
        </div>

      {:else if activeTab === "novels"}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">书名 *</label>
            <input bind:value={novelForm.title} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">作者 *</label>
            <input bind:value={novelForm.author} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">封面URL</label>
            <input bind:value={novelForm.cover} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="https://..." />
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">状态</label>
            <select bind:value={novelForm.status} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm">
              {#each novelStatuses as s}
                <option value={s.value}>{s.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="text-sm text-neutral-500 mb-1 block">标签 (逗号分隔)</label>
            <input bind:value={novelForm.tags} class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm" placeholder="奇幻, 冒险" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-sm text-neutral-500 mb-1 block">简介</label>
            <textarea bind:value={novelForm.description} rows="3" class="w-full px-3 py-2 rounded-lg bg-(--btn-regular-bg) border border-(--line-divider) text-sm resize-y"></textarea>
          </div>
        </div>
      {/if}

      <div class="flex items-center gap-3 mt-4">
        <button onclick={saveItem}
                class="btn-regular px-6 py-2 rounded-lg text-sm font-medium bg-(--primary) text-white">
          {editingId ? "保存" : "添加"}
        </button>
        <button onclick={() => { showForm = false; resetForm(); }}
                class="btn-regular px-4 py-2 rounded-lg text-sm">取消</button>
      </div>
    </div>
  {/if}

  <!-- Item list -->
  {#if currentItems.length > 0}
    <div class="space-y-3">
      {#each currentItems as item (item.id)}
        <div class="flex items-center gap-4 p-4 rounded-xl bg-(--card-bg) border border-(--line-divider)">
          <!-- Cover -->
          {#if item.cover}
            <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-(--btn-regular-bg)">
              <img src={item.cover} alt={item.title} class="w-full h-full object-cover" loading="lazy" />
            </div>
          {:else}
            <div class="w-16 h-16 rounded-lg flex-shrink-0 bg-(--btn-regular-bg) flex items-center justify-center text-neutral-400 text-2xl">
              {activeTab === "anime" ? "&#x1f3ac;" : activeTab === "music" ? "&#x1f3b5;" : "&#x1f4d6;"}
            </div>
          {/if}

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">{item.title}</h4>
            <p class="text-xs text-neutral-500 line-clamp-1">
              {#if activeTab === "anime"}
                {(item as any).year || ""} {(item as any).status || ""}
              {:else if activeTab === "music"}
                {(item as any).artist || ""}
              {:else}
                {(item as any).author || ""}
              {/if}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button onclick={() => editItem(item.id)}
                    class="p-2 rounded-lg hover:bg-(--btn-regular-bg) text-neutral-500 hover:text-(--primary) transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onclick={() => removeItem(item.id)}
                    class="p-2 rounded-lg hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
      <p class="text-sm">暂无数据，点击上方"添加"按钮开始</p>
    </div>
  {/if}
</div>
