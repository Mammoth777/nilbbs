# 使用多阶段构建以支持多架构
ARG TARGETPLATFORM
FROM alpine:latest

# 设置工作目录
WORKDIR /app

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata sqlite

# 设置时区为亚洲/上海
ENV TZ=Asia/Shanghai

# 根据目标平台复制二进制文件
COPY releases /app
COPY static /app/static
COPY templates /app/templates

# 根据平台选择二进制文件
RUN case "$TARGETPLATFORM" in \
    "linux/amd64") cp /releases/nilbbs-amd64 /app/nilbbs ;; \
    "linux/arm64") cp /releases/nilbbs-arm64 /app/nilbbs ;; \
    *) echo "Unsupported platform: $TARGETPLATFORM" && exit 1 ;; \
    esac

# 确保二进制文件有执行权限
RUN chmod +x /app/nilbbs

# 确保数据目录存在
RUN mkdir -p /app/data

# 暴露应用端口
EXPOSE 8080

# 运行应用
CMD ["./nilbbs"]