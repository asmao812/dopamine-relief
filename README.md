# 悦己镇 · Joyville

> Treat yourself better.
> 一座只服务你的小镇——美食、数码、奢品、SPA，逛逛就解压。
> A small town where everything is about you — browse, indulge, relieve stress.

---

## 中文说明

**悦己镇**是一个基于 React 的渐进式 Web 应用（PWA），让你足不出户浏览高端餐厅、数码奢品和 SPA 体验——一座只服务你的小镇。逛一逛，释放多巴胺。

### 功能特点

- 🍽️ **20+ 精选高端餐厅** — 大董烤鸭、新荣记、Ultraviolet by Paul Pairet 等
- 📱 **数码奢品** — 华为 Mate XT、iPhone 等旗舰好物
- 💆 **SPA 体验** — 高端水疗与身体护理
- 🌐 **中英双语** — 支持中文 / English 切换
- 📱 **PWA 支持** — 可添加到手机主屏幕，离线可用
- 🐳 **Docker 一键部署** — Nginx + SSL，开箱即用

### 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 18（CDN 引入，零构建） |
| 样式 | 纯 CSS（CSS Variables） |
| 部署 | Docker + Nginx Alpine |
| SSL | Let's Encrypt 自动续期 |
| PWA | Service Worker + Web App Manifest |

### 快速启动

```bash
# 启动开发模式（直接打开 dist/index.html）
cd dist && python3 -m http.server 8080

# 或 Docker 部署
docker compose up -d
```

访问 http://localhost:8080

### 项目结构

```
dopamine-app/
├── dist/                   # 生产文件
│   ├── index.html          # 主入口（React SPA）
│   ├── manifest.json       # PWA 清单
│   ├── sw.js               # Service Worker
│   ├── data/
│   │   ├── restaurants.json # 餐厅数据（20+家）
│   │   ├── products.json    # 商品数据
│   │   └── categories.json  # 分类数据
│   ├── src/
│   │   ├── App.jsx          # React 应用入口
│   │   ├── scenes/          # 页面组件
│   │   ├── components/      # UI 组件
│   │   ├── i18n/            # 国际化
│   │   └── styles/          # 样式
│   └── assets/              # 图标等静态资源
├── public/                  # 公共资源
├── nginx.conf               # Nginx 配置（SSL + Gzip + SPA）
└── docker-compose.yml       # Docker 编排
```

---

## English

**Joyville** is a React Progressive Web App (PWA) for browsing curated high-end restaurants, luxury gadgets, and spa experiences. Step into a small town built just for you — browse, indulge, and let the dopamine flow.

### Features

- 🍽️ **20+ Curated Restaurants** — Da Dong Roast Duck, Xin Rong Ji, Ultraviolet by Paul Pairet, and more
- 📋 **Full Menu Browsing** — Each dish with image, description, and price
- 🌐 **Bilingual** — Chinese / English toggle
- 📱 **PWA Ready** — Add to home screen, offline capable
- 🐳 **Docker Deploy** — Nginx + SSL, ready in one command

### Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18 (CDN, zero build step) |
| Styling | Pure CSS (CSS Variables) |
| Deployment | Docker + Nginx Alpine |
| SSL | Let's Encrypt auto-renewal |
| PWA | Service Worker + Web App Manifest |

### Quick Start

```bash
# Dev mode (open dist/index.html directly)
cd dist && python3 -m http.server 8080

# Or Docker
docker compose up -d
```

Visit http://localhost:8080

### Project Structure

```
dopamine-app/
├── dist/                   # Production files
│   ├── index.html          # Entry point (React SPA)
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker
│   ├── data/
│   │   ├── restaurants.json # Restaurant data (20+)
│   │   ├── products.json    # Product data
│   │   └── categories.json  # Category data
│   ├── src/
│   │   ├── App.jsx          # React app entry
│   │   ├── scenes/          # Page components
│   │   ├── components/      # UI components
│   │   ├── i18n/            # Internationalization
│   │   └── styles/          # Stylesheets
│   └── assets/              # Icons & static assets
├── public/                  # Public assets
├── nginx.conf               # Nginx config (SSL + Gzip + SPA)
└── docker-compose.yml       # Docker orchestration
```

---

## License

MIT
