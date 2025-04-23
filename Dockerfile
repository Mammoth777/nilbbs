# 不需要构建阶段，直接使用预构建的二进制文件
FROM alpine:latest

WORKDIR /app

# 安装基本依赖
RUN apk --no-cache add ca-certificates tzdata sqlite

# 设置时区为亚洲/上海
ENV TZ=Asia/Shanghai

# 二进制文件和静态资源将在构建时通过 COPY 命令添加
# 这些步骤将在 GitHub Actions 中执行

# 创建数据目录
RUN mkdir -p /app/data

# 暴露应用端口
EXPOSE 8080

# 设置工作目录
WORKDIR /app

# 运行应用
CMD ["./nilbbs"]