# 使用多阶段构建
FROM --platform=$BUILDPLATFORM alpine:latest AS builder

# 创建工作目录
WORKDIR /build

# 接收构建参数
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# 根据目标平台选择正确的二进制文件
RUN mkdir -p /app && \
    echo "Building for $TARGETPLATFORM on $BUILDPLATFORM"

# 复制所有预编译的二进制文件和资源
COPY nilbbs-linux-amd64 /build/nilbbs-linux-amd64
COPY nilbbs-linux-arm64 /build/nilbbs-linux-arm64
COPY static /app/static
COPY templates /app/templates

# 根据目标平台选择正确的二进制文件
RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
        cp /build/nilbbs-linux-amd64 /app/nilbbs; \
    elif [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        cp /build/nilbbs-linux-arm64 /app/nilbbs; \
    else \
        echo "Unsupported platform: $TARGETPLATFORM"; \
        exit 1; \
    fi && \
    chmod +x /app/nilbbs

# 最终镜像
FROM alpine:latest

WORKDIR /app

# 安装基本依赖
RUN apk --no-cache add ca-certificates tzdata sqlite

# 设置时区为亚洲/上海
ENV TZ=Asia/Shanghai

# 从构建阶段复制应用和资源
COPY --from=builder /app /app

# 创建数据目录
RUN mkdir -p /app/data

# 暴露应用端口
EXPOSE 8080

# 运行应用
CMD ["./nilbbs"]