# 使用多阶段构建
FROM --platform=$BUILDPLATFORM alpine:latest AS builder

# 创建工作目录
WORKDIR /build

# 接收构建参数
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# 创建应用目录
RUN mkdir -p /app && \
    echo "Building for $TARGETPLATFORM on $BUILDPLATFORM"

# 复制预编译的二进制文件
COPY nilbbs /build/nilbbs
COPY static /app/static
COPY templates /app/templates

# 将二进制文件复制到应用目录并设置权限
RUN cp /build/nilbbs /app/nilbbs && \
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