# 小说、音乐、动画功能使用文档

## 目录

- [功能概述](#功能概述)
- [开启功能](#开启功能)
- [小说功能](#小说功能)
- [音乐库功能](#音乐库功能)
- [动画收藏功能](#动画收藏功能)
- [后台管理页面](#后台管理页面)
- [侧边栏正在播放组件](#侧边栏正在播放组件)
- [数据导入导出](#数据导入导出)

---

## 功能概述

本主题新增了三个内容展示模块和一个后台管理页面：

| 功能 | 页面路径 | 说明 |
|------|----------|------|
| 小说 | `/novels/` | 小说书架，支持卷章目录、在线阅读 |
| 音乐库 | `/music/` | 音乐收藏，支持在线播放、歌词显示 |
| 动画收藏 | `/anime/` | 动画收藏，支持状态筛选、评分、简介悬浮 |
| 后台管理 | `/admin/` | 通过浏览器管理上述三种内容 |

---

## 开启功能

在 `src/config/siteConfig.ts` 中设置页面开关：

```typescript
pages: {
  // ... 其他页面
  novels: true,        // 小说功能
  musicLibrary: true,  // 音乐库功能
  anime: true,         // 动画收藏功能
  admin: true,         // 后台管理页面（建议仅在需要时开启）
}
```

设置为 `false` 可关闭对应功能，访问时会跳转到 404 页面。

> **注意**：`admin` 默认为 `false`。管理页面不在导航栏显示，需要手动访问 `/admin/`。

---

## 小说功能

### 通过配置文件添加

在 `src/config/novelConfig.ts` 中可配置全局选项：

```typescript
export const novelConfig = {
  itemsPerPage: 12,
  showTags: true,
};
```

### 通过文件系统添加

在 `src/content/novels/` 目录下创建小说文件夹：

```
src/content/novels/
  └── my-novel/
      ├── meta.md          # 小说元信息（必需）
      ├── vol1/
      │   ├── ch001.md     # 第一章
      │   └── ch002.md     # 第二章
      └── vol2/
          └── ch001.md     # 第三章
```

**meta.md 格式：**

```markdown
---
type: "novel"
title: "小说标题"
author: "作者名"
cover: "/images/cover.jpg"
description: "小说简介"
tags: ["奇幻", "冒险"]
status: "ongoing"
---
```

- `status`：`"ongoing"`（连载中）或 `"completed"`（已完结）
- `cover`：封面图片路径，可以是站内路径或外部 URL

**章节文件格式：**

```markdown
---
type: "chapter"
title: "第一章 章节标题"
volume: "第一卷"
chapter: 1
---

正文内容，支持完整的 Markdown 语法。
```

- `volume`：卷名，用于分组显示
- `chapter`：章节序号，用于排序

### 通过后台管理添加

访问 `/admin/` 页面，切换到「小说」标签页，填写表单即可添加。通过管理后台添加的小说会保存在浏览器 localStorage 中，页面加载时自动合并显示。

### 访问路径

- 小说列表：`/novels/`
- 小说详情：`/novels/{novel-id}/`
- 章节阅读：`/novels/{novel-id}/{volume}/{chapter}/`

---

## 音乐库功能

### 通过配置文件添加

在 `src/config/musicLibraryConfig.ts` 中添加音乐条目：

```typescript
export const musicLibraryConfig = {
  items: [
    {
      title: "歌曲名称",
      artist: "艺术家",
      album: "专辑名",         // 可选
      url: "/music/song.mp3",
      cover: "/images/cover.jpg",
      lrc: "/music/song.lrc",  // 可选，歌词文件
      duration: "3:45",        // 可选
      tags: ["流行", "华语"],
      sourceLink: "https://...", // 可选，外部链接
    },
  ],
};
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 歌曲名称 |
| `artist` | 是 | 艺术家/歌手 |
| `url` | 是 | 音频文件路径或 URL |
| `cover` | 否 | 封面图片 |
| `lrc` | 否 | 歌词文件路径（.lrc 格式）或内联歌词 |
| `album` | 否 | 专辑名 |
| `duration` | 否 | 时长显示 |
| `tags` | 否 | 标签数组，用于筛选 |
| `sourceLink` | 否 | 外部来源链接 |

### 播放功能

点击歌曲卡片上的播放按钮即可播放。播放时：

- 底部播放器自动弹出
- 侧边栏「正在播放」组件显示当前曲目
- 支持歌词同步显示（需配置 .lrc 文件）

### 通过后台管理添加

访问 `/admin/` 页面，切换到「音乐」标签页，填写表单即可添加。

---

## 动画收藏功能

### 通过配置文件添加

在 `src/config/animeConfig.ts` 中添加动画条目：

```typescript
export const animeConfig = {
  items: [
    {
      title: "动画名称",
      titleJa: "日文名",        // 可选
      cover: "/images/cover.jpg",
      status: "watching",
      rating: 8.5,              // 可选，评分
      year: 2024,               // 可选
      episodes: { watched: 12, total: 24 }, // 可选
      tags: ["奇幻", "冒险"],
      synopsis: "简介...",      // 可选，悬浮显示
      link: "https://...",      // 可选，外部链接
    },
  ],
};
```

### 状态选项

| 状态值 | 显示标签 | 颜色 |
|--------|----------|------|
| `watching` | 在看 | 绿色 |
| `completed` | 看完 | 蓝色 |
| `on-hold` | 搁置 | 黄色 |
| `dropped` | 抛弃 | 红色 |
| `plan-to-watch` | 想看 | 紫色 |

### 筛选功能

页面提供两级筛选：

1. **状态筛选**：按观看状态过滤
2. **标签筛选**：按标签过滤

两级筛选为「且」的关系，同时满足才显示。

### 通过后台管理添加

访问 `/admin/` 页面，切换到「动画」标签页，填写表单即可添加。

---

## 后台管理页面

### 访问方式

直接访问 `/admin/` 路径。页面不在导航栏显示，需要手动输入 URL。

> **重要**：使用前需在 `siteConfig.ts` 中设置 `admin: true`。

### 功能说明

管理页面提供三个标签页：**动画**、**音乐**、**小说**。

每个标签页包含：
- **添加表单**：填写字段后点击「添加」按钮
- **条目列表**：显示已添加的条目，支持编辑和删除
- **编辑功能**：点击「编辑」按钮，表单自动填充现有数据，修改后点击「更新」
- **删除功能**：点击「删除」按钮，确认后删除条目

### 数据存储

管理页面的数据存储在浏览器 **localStorage** 中，key 为 `firefly-admin-data`。

数据格式：

```json
{
  "anime": [...],
  "music": [...],
  "novels": [...]
}
```

### 数据合并机制

各展示页面（`/anime/`、`/music/`、`/novels/`）会自动合并两种数据源：

1. **配置文件数据**：构建时从 config 文件读取
2. **localStorage 数据**：运行时从浏览器读取并动态插入

两种数据在页面上统一显示，无需手动合并。

---

## 侧边栏正在播放组件

在侧边栏配置中添加 `nowPlaying` 组件，可显示当前正在播放的音乐。

在 `src/config/sidebarLayoutConfig.ts` 中配置：

```typescript
leftComponents: [
  // ... 其他组件
  {
    type: "nowPlaying",
    enable: true,
    position: "top",
  },
],
```

组件默认隐藏，当有音乐播放时自动显示封面、歌名和艺术家。

---

## 数据导入导出

在 `/admin/` 页面顶部有「导出」和「导入」按钮。

### 导出

点击「导出」按钮，会下载一个 JSON 文件，包含所有通过管理页面添加的数据。

### 导入

有两种导入方式：

1. **粘贴 JSON**：将 JSON 数据粘贴到文本框中，点击「导入」
2. **上传文件**：点击「上传文件」按钮，选择之前导出的 JSON 文件

导入的数据会**覆盖**现有 localStorage 数据。

> **建议**：定期导出数据备份，避免因清除浏览器数据导致丢失。

---

## 导航栏配置

功能页面会自动添加到导航栏的「我的」子菜单中（如果已配置）。如需自定义，在 `src/config/navBarConfig.ts` 中调整。

默认添加的导航项：

| LinkPreset | 路径 | 图标 |
|------------|------|------|
| `LinkPreset.Novels` | `/novels/` | `material-symbols:menu-book` |
| `LinkPreset.MusicLibrary` | `/music/` | `material-symbols:library-music` |
| `LinkPreset.Anime` | `/anime/` | `material-symbols:animation` |

---

## 多语言支持

所有新增功能支持 5 种语言：简体中文、繁体中文、英文、日文、俄文。

翻译文件位于 `src/i18n/languages/` 目录下。
