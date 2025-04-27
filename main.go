package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Mammoth777/nilbbs/database"
	"github.com/Mammoth777/nilbbs/handlers"
	"github.com/Mammoth777/nilbbs/nickname"
	"github.com/Mammoth777/nilbbs/utils"
	"github.com/gin-gonic/gin"
)

// 定期删除旧帖子的函数
func setupPostCleanupTask() *utils.ScheduledTask {
	// 创建一个每 1 小时执行一次的定时任务
	interval := 1 * time.Hour
	// interval := 10 * time.Second // 测试时使用10s
	task := utils.NewScheduledTask(interval, func() {
		// 使用配置中的天数值，默认为30天
		daysToKeep := utils.Config.InactiveDaysBeforeDelete
		count, err := database.DeleteOldPosts(daysToKeep)
		if err != nil {
			log.Printf("删除旧帖子时出错: %v", err)
			return
		}
		log.Printf("成功删除了 %d 条超过 %d 天不活跃的旧帖子", count, daysToKeep)
	})
	
	// 设置为不在启动时立即执行
	task.RunOnStartup = false
	
	return task
}

func main() {
	// 从环境变量加载配置
	utils.LoadConfigFromEnv()
	
	// 初始化数据库
	if err := database.InitDB(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer database.CloseDB()
	
	// 设置定期删除旧帖子的任务
	cleanupTask := setupPostCleanupTask()
	cleanupTask.Start()
	defer cleanupTask.Stop()

	// 创建Gin引擎
	r := gin.Default()

	// 设置静态文件服务
	r.Static("/static", "./static")
	
	// 加载HTML模板
	r.LoadHTMLGlob("templates/*")

	// 首页路由
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "NilBBS - Minimalist Anonymous Forum",
		})
	})

	// 帖子详情页面
	r.GET("/post/:id", func(c *gin.Context) {
		c.HTML(http.StatusOK, "post.html", gin.H{
			"title": "Detail - NilBBS",
			"postID": c.Param("id"),
		})
	})

	// 健康检查
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// 帖子路由
	r.GET("/api/posts", handlers.GetAllPosts)
	r.GET("/api/posts/:id", handlers.GetPostByID)
	r.POST("/api/posts", handlers.CreatePost)

	// 评论路由
	r.POST("/api/posts/:id/comments", handlers.AddComment)
	r.GET("/api/random-go-nickname", func(c *gin.Context) {
    	c.String(http.StatusOK, nickname.GetRandomNickname())
	})

	// 设置优雅关闭
	srv := &http.Server{
		Addr:    ":" + utils.Config.ServerPort,
		Handler: r,
	}

	// 在一个单独的goroutine中启动服务器
	go func() {
		log.Printf("NilBBS服务启动在 http://localhost:%s", utils.Config.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("启动服务器失败: %v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("正在关闭服务器...")
}