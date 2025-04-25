# nilbbs Makefile
# 用于构建、优化和部署nilbbs应用

# 应用名称
APP_NAME=nilbbs
# 主文件位置
MAIN_FILE=main.go
# 默认构建目标
BUILD_TARGET=$(APP_NAME)

# 检测操作系统
ifeq ($(OS),Windows_NT)
    DETECTED_OS := windows
    BUILD_TARGET := $(APP_NAME).exe
else
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Linux)
        DETECTED_OS := linux
    endif
    ifeq ($(UNAME_S),Darwin)
        DETECTED_OS := macos
    endif
endif

# 基础构建命令
build:
	go build -o $(BUILD_TARGET) $(MAIN_FILE)

# 优化大小的构建命令 (去除调试信息和符号表)
build-small:
	go build -ldflags="-s -w" -o $(BUILD_TARGET) $(MAIN_FILE)

# 生产环境构建 (去除调试信息，禁用CGO)
build-prod:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(BUILD_TARGET) $(MAIN_FILE)

# 为不同操作系统构建

build-amd64:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -ldflags="-s -w" -o releases/$(APP_NAME)-amd64 $(MAIN_FILE)

build-arm64:
	CC=aarch64-linux-gnu-gcc CGO_ENABLED=1 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o releases/$(APP_NAME)-arm64 $(MAIN_FILE)

# 构建所有平台
build-all: build-amd64 build-arm64

# 根据当前系统自动选择构建目标
build-current:
	@echo "为当前系统 ($(DETECTED_OS)) 构建..."
	$(MAKE) build-$(DETECTED_OS)

# 查看二进制文件大小
size:
	@ls -lh $(BUILD_TARGET) | awk '{print "当前二进制大小: " $$5}'

# 清理构建产物
clean:
	rm -f $(BUILD_TARGET) $(APP_NAME).exe $(APP_NAME)-linux $(APP_NAME)-macos $(APP_NAME)-arm64

# 运行应用
run: build
	./$(BUILD_TARGET)

# 运行优化版本
run-small: build-small
	./$(BUILD_TARGET)

# 查看依赖分析
deps:
	go mod why -m all

# 构建Docker镜像
docker-build:
	docker build -t $(APP_NAME):latest .

# 默认目标
.DEFAULT_GOAL := build

# 声明伪目标
.PHONY: build build-small build-prod size clean run run-small deps docker-build build-windows build-linux build-macos build-arm64 build-all build-current