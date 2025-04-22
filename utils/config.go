package utils

import (
	"log"
	"os"
	"strconv"
)

// AppConfig 存储应用程序的配置信息
type AppConfig struct {
	// 自动删除超过多少天不活跃的帖子
	InactiveDaysBeforeDelete int
	// 服务器监听端口
	ServerPort string
}

// 环境变量名常量
const (
	// 不活跃帖子删除天数的环境变量名
	EnvInactiveDaysBeforeDelete = "NILBBS_INACTIVE_DAYS_BEFORE_DELETE"
	// 服务器端口的环境变量名
	EnvServerPort = "NILBBS_PORT"
)

// Config 是应用程序配置的全局实例
var Config = AppConfig{
	// 默认值：7天不活跃的帖子将被删除
	InactiveDaysBeforeDelete: 7,
	// 默认端口：8080
	ServerPort: "8080",
}

// LoadConfigFromEnv 从环境变量加载配置
func LoadConfigFromEnv() {
	// 加载不活跃帖子删除天数
	if daysStr := os.Getenv(EnvInactiveDaysBeforeDelete); daysStr != "" {
		if days, err := strconv.Atoi(daysStr); err == nil && days > 0 {
			Config.InactiveDaysBeforeDelete = days
			log.Printf("从环境变量加载配置：%s = %d", EnvInactiveDaysBeforeDelete, days)
		} else if err != nil {
			log.Printf("环境变量 %s 的值 '%s' 无效，使用默认值 %d", 
				EnvInactiveDaysBeforeDelete, daysStr, Config.InactiveDaysBeforeDelete)
		}
	}
	
	// 加载服务器端口配置
	if portStr := os.Getenv(EnvServerPort); portStr != "" {
		// 验证端口是有效的数字
		if _, err := strconv.Atoi(portStr); err == nil {
			Config.ServerPort = portStr
			log.Printf("从环境变量加载配置：%s = %s", EnvServerPort, portStr)
		} else {
			log.Printf("环境变量 %s 的值 '%s' 无效，使用默认端口 %s", 
				EnvServerPort, portStr, Config.ServerPort)
		}
	}
}

// SetInactiveDaysBeforeDelete 设置帖子不活跃多少天后会被删除
func SetInactiveDaysBeforeDelete(days int) {
	if days > 0 {
		Config.InactiveDaysBeforeDelete = days
	}
}

// SetServerPort 设置服务器端口
func SetServerPort(port string) {
	if port != "" {
		if _, err := strconv.Atoi(port); err == nil {
			Config.ServerPort = port
		}
	}
}