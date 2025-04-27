# 第一阶段：构建阶段
FROM golang:1.23-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的构建工具和依赖
RUN apk add --no-cache gcc musl-dev make git

# 复制go.mod和go.sum文件，先下载依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制所有源代码
COPY . .

# 基于当前构建架构编译
ARG TARGETARCH
ARG CGO_ENABLED=1
RUN echo "Building for architecture: ${TARGETARCH}" && \
    go build -ldflags="-s -w" -o nilbbs .

# 第二阶段：运行阶段
FROM alpine:latest

# 安装SQLite运行时依赖
RUN apk add --no-cache ca-certificates tzdata sqlite

# 设置工作目录
WORKDIR /app

# 从构建阶段复制编译好的应用
COPY --from=builder /app/nilbbs /app/
# 复制必要的静态资源和模板
COPY --from=builder /app/static /app/static
COPY --from=builder /app/templates /app/templates
# 创建数据目录
RUN mkdir -p /app/data

# 设置默认环境变量
ENV SERVER_PORT=8080
ENV INACTIVE_DAYS_BEFORE_DELETE=30

# 暴露端口
EXPOSE ${SERVER_PORT}

# 设置入口点
ENTRYPOINT ["/app/nilbbs"]