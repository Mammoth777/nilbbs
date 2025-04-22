package main

import (
	"log"
	"net/http"

	"github.com/Mammoth777/nilbbs/database"
	"github.com/Mammoth777/nilbbs/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	if err := database.InitDB(); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer database.CloseDB()

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

	// 启动服务器
	log.Println("NilBBS服务启动在 http://localhost:8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}