# nilbbs

NilBBS 是一个极简匿名留言板系统，支持发帖和回复功能。

[English](README.md) | [中文](README_zh.md)

![NilBBS Screenshot 1](images/img1.png)
![NilBBS Screenshot 2](images/img2.png)

## 功能特点

- [x] 极简设计
- [x] 匿名发帖
- [x] 回复功能
- [x] 简洁清晰的用户界面
- [x] 自动定期清理旧帖子

## 快速开始

### 通过可执行文件运行

1.  **下载**: 从 [GitHub Releases](https://github.com/Mammoth777/nilbbs/releases) 下载适合您平台的最新版本。
2.  **解压**: 解压下载的文件（如有需要）。
3.  **运行**:
    *   打开终端并导航到解压后的目录。
    *   运行可执行文件：

    ```bash
    # 在 macOS/Linux 上
    chmod +x ./nilbbs
    ./nilbbs

    # 在 Windows 上
    nilbbs.exe
    ```

服务器将在 http://localhost:8080 启动。

您可以通过环境变量来配置应用，例如设置端口或帖子自动删除时间。详情请参阅 [配置](#配置) 部分。

### Docker

您也可以使用 Docker 运行 nilbbs：

```bash
# 拉取最新镜像
docker pull mammoth777/nilbbs:latest

# 运行容器
docker run -d -p 8080:8080 mammoth777/nilbbs:latest

# 自定义配置
docker run -d -p 3000:3000 -e NILBBS_PORT=3000 -e NILBBS_INACTIVE_DAYS_BEFORE_DELETE=14 mammoth777/nilbbs:latest
```

或者使用 docker-compose：

```yaml
# docker-compose.yml
version: '3'
services:
  nilbbs:
    image: mammoth777/nilbbs:latest
    ports:
      - "8080:8080"
    environment:
      - NILBBS_INACTIVE_DAYS_BEFORE_DELETE=7
    restart: unless-stopped
```

然后运行：

```bash
docker-compose up -d
```

## 配置

通过环境变量进行配置：

- `NILBBS_INACTIVE_DAYS_BEFORE_DELETE`：不活跃帖子自动删除的天数（默认：7天）
- `NILBBS_PORT`：服务器监听端口（默认：8080）

示例：

```bash
# 设置14天不活跃的帖子会被自动删除
NILBBS_INACTIVE_DAYS_BEFORE_DELETE=14 ./nilbbs

# 在端口3000上启动服务器
NILBBS_PORT=3000 ./nilbbs

# 组合多个设置
NILBBS_PORT=3000 NILBBS_INACTIVE_DAYS_BEFORE_DELETE=14 ./nilbbs
```

## 开发者指南

### 环境要求

- Go 1.19 或更高版本
- Git

### 开发环境设置

1. 克隆仓库：

```bash
git clone https://github.com/Mammoth777/nilbbs.git
cd nilbbs
```

2. 运行应用：

```bash
go run main.go
```

或者构建后运行：

```bash
go build
./nilbbs
```

### 使用 Makefile

项目包含一个 Makefile，用于常见操作：

```bash
# 构建应用
make build-amd64 # 构建适用于 amd64 的应用
make package # 打包应用
```

## API 接口

- `GET /api/posts`：获取所有帖子
- `GET /api/posts/:id`：获取特定帖子及其评论
- `POST /api/posts`：创建新帖子
- `POST /api/posts/:id/comments`：向帖子添加评论

## 许可证

[MIT 许可证](LICENSE)