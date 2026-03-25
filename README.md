# 森果云项目（senguoyun）

一个前后端分离的本地待办清单小工具：Vue 3 界面、FastAPI 接口、MySQL 持久化。适合作为个人清单或二次开发模板。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Vite |
| 后端 | Python 3.9+、FastAPI、SQLAlchemy 2、Pydantic |
| 数据库 | MySQL 8（Docker 提供；也可使用本机已有实例） |

## 功能

- 新建任务：标题、备注、优先级（普通 / 重要 / 紧急）
- 列表与筛选：全部、进行中、已完成
- 勾选完成、编辑、删除
- 简单条数统计

## 环境要求

- [Node.js](https://nodejs.org/)（建议 18+，用于前端）
- [Python](https://www.python.org/) 3.9+
- [Docker](https://www.docker.com/)（可选，用于一键启动 MySQL）

## 快速开始

### 1. 启动数据库

在项目根目录执行：

```bash
docker compose up -d mysql
```

默认将容器内 `3306` 映射到**宿主机 `3307`**，避免与本机已占用的 3306 冲突。若需改端口，可编辑 `docker-compose.yml` 中的 `ports`，并同步修改后端 `DATABASE_URL`。

### 2. 配置后端（可选）

若使用上述 Docker MySQL，可跳过此步（后端默认连接串已与 compose 一致）。

否则在 `backend` 目录复制环境变量文件并修改连接：

```bash
cd backend
cp .env.example .env
# 编辑 .env 中的 DATABASE_URL
```

### 3. 安装并启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

启动后：

- 健康检查：<http://127.0.0.1:8000/health>
- 交互式 API 文档（Swagger）：<http://127.0.0.1:8000/docs>

### 4. 安装并启动前端

新开终端：

```bash
cd frontend
npm install
npm run dev
```

按终端提示在浏览器打开（一般为 <http://127.0.0.1:5173>）。开发模式下 Vite 会把 `/api` 代理到 `http://127.0.0.1:8000`，因此需先启动后端。

生产构建：

```bash
cd frontend
npm run build
```

产物在 `frontend/dist/`，可配合任意静态文件服务器部署；请求需能访问到同一域或配置好的后端地址（生产环境请按需调整 `vite.config.js` 中的 `proxy` 或改为完整 API 基址）。

## 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | SQLAlchemy 连接串（PyMySQL） | `mysql+pymysql://用户:密码@主机:端口/库名` |

仅在 `backend` 目录下的 `.env` 中配置；未创建 `.env` 时使用 `app/config.py` 中的默认值。

## 目录结构

```
senguoyun/
├── backend/                 # FastAPI 应用
│   ├── app/
│   │   ├── main.py          # 入口、CORS、路由挂载
│   │   ├── config.py        # 配置（含 DATABASE_URL）
│   │   ├── database.py      # 引擎与 Session
│   │   ├── models.py        # ORM 模型
│   │   ├── schemas.py       # Pydantic 模型
│   │   └── routers/
│   │       └── tasks.py     # 任务 CRUD
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # Vue + Vite
│   ├── src/
│   │   ├── App.vue
│   │   ├── api.js           # 封装 /api 请求
│   │   └── ...
│   └── vite.config.js       # 开发代理 /api → 8000
├── docker-compose.yml       # MySQL 服务
└── README.md
```

## API 概要

前缀：`/api/tasks`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 列表；可选查询参数 `completed=true|false` |
| POST | `/api/tasks` | 创建 |
| GET | `/api/tasks/{id}` | 单条 |
| PATCH | `/api/tasks/{id}` | 部分更新 |
| DELETE | `/api/tasks/{id}` | 删除 |

详细请求体与响应见 Swagger：`/docs`。

## 常见问题

- **连不上数据库**：确认 MySQL 已启动、端口与 `.env` / 默认配置一致；首次用 Docker 需等待容器就绪数秒再启动后端。
- **前端报网络错误**：确认后端已在 `8000` 端口运行，且使用 `npm run dev`（以启用代理）。

## 许可证

按仓库维护者约定使用；若未指定，以项目根目录许可证文件为准。
