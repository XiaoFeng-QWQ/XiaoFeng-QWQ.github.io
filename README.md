# Personal Dashboard

一个个人主页 / 工作台项目，集成了搜索、时间、GitHub 信息、音乐播放器、任务清单、番茄钟等常用功能，支持深色/浅色主题和响应式布局。

> 项目主要作为个人首页使用，也可以根据需要修改成自己的导航页或工作台。

---

## 功能

* 搜索

  * 支持 Google、Bing、Baidu
  * 支持快捷切换搜索引擎（`Tab`）
  * `Ctrl + K` 快速聚焦搜索框

* 时间

  * 12/24 小时制切换
  * 太阳轨迹显示昼夜状态

* 任务清单

  * 添加、完成、删除待办事项
  * 数据保存在浏览器本地

* 番茄钟

  * 专注 / 休息模式
  * 倒计时
  * 进度显示
  * 提示音

* GitHub

  * 贡献日历
  * 最近动态
  * 用户信息
  * 仓库列表

* 音乐播放器

  * 支持网易云歌单
  * 上一首、下一首、播放控制
  * 歌词同步（LRC）
  * Document Picture-in-Picture 歌词悬浮窗

* 天气

  * 根据 IP 获取当前天气

* 主题

  * 深色 / 浅色模式
  * View Transitions API 切换动画

* 响应式布局

  * 支持桌面端和移动端

---

## 技术栈

* React 19
* TypeScript
* Vite 8
* Tailwind CSS 4
* React Router DOM 7
* Lucide React

使用到的 Web API：

* Web Audio API
* Document Picture-in-Picture API
* View Transitions API
* LocalStorage

---

## 开始使用

### 克隆仓库

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认地址：

```
http://localhost:5173
```

### 构建

```bash
npm run build
```

构建后的文件位于：

```
dist/
```

---

## 项目结构

```text
.
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 配置

### 搜索引擎

修改 `App.tsx` 中的 `SEARCH_ENGINES` 数组即可。

### 网易云歌单

找到：

```ts
fetch("https://api.xiaofengqwq.com/api/v1/music/playlist?server=netease&id=6634356386")
```

将 `id` 修改为自己的歌单 ID。

如果接口不可用，将使用内置示例数据。

### 天气接口

默认：

```
https://api.xiaofengqwq.com/api/v1/tools/weather
```

可以替换为自己的接口。

### GitHub 用户

项目默认使用：

```
XiaoFeng-QWQ
```

如需修改，搜索并替换即可。

---

## 页面

| 页面       | 路径         | 内容                                 |
| ---------- | ------------ | ------------------------------------ |
| Identity   | `/`          | 个人信息                             |
| Workspace  | `/workspace` | 搜索、时间、任务、番茄钟、音乐、天气 |
| Projects   | `/projects`  | GitHub 信息                          |
| Tech Stack | `/stack`     | 技术栈展示                           |

页面之间通过底部 Dock 切换。

---

## 浏览器支持

推荐使用最新版 Chrome 或 Edge。

Firefox、Safari 可以正常使用大部分功能，但部分实验性 API（如 Document Picture-in-Picture、View Transitions）可能不可用。

---

## License

仅供学习和个人使用。

如需二次修改，请保留原作者信息。

---

## 联系

作者：XiaoFeng_QWQ

GitHub：https://github.com/XiaoFeng-QWQ

博客：https://blog.xiaofengqwq.com