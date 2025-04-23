# 使用多阶段构建减小最终镜像大小
# 第一阶段：构建应用
FROM --platform=$BUILDPLATFORM golang:1.23-alpine AS builder

# 添加构建参数，用于跨平台构建
ARG BUILDPLATFORM
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用，根据目标架构编译
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -ldflags="-s -w" -o nilbbs main.go

# 第二阶段：运行应用
FROM --platform=$TARGETPLATFORM alpine:latest

WORKDIR /app

# 安装基本依赖
RUN apk --no-cache add ca-certificates tzdata

# 设置时区为亚洲/上海
ENV TZ=Asia/Shanghai

# 从构建阶段复制二进制文件
COPY --from=builder /app/nilbbs /app/
# 复制必要的静态文件和模板
COPY --from=builder /app/static /app/static
COPY --from=builder /app/templates /app/templates
# 创建数据目录
RUN mkdir -p /app/data

# 暴露应用端口（假设默认端口是8080，根据实际情况调整）
EXPOSE 8080

# 设置工作目录为/app的原因是应用可能会相对当前目录访问资源
WORKDIR /app

# 运行应用
CMD ["./nilbbs"]