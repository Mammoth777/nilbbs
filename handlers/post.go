package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/Mammoth777/nilbbs/database"
	"github.com/Mammoth777/nilbbs/models"
	"github.com/Mammoth777/nilbbs/utils"
	"github.com/gin-gonic/gin"
)

// CreatePost 创建新帖子
func CreatePost(c *gin.Context) {
	var post models.Post
	if err := c.ShouldBindJSON(&post); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据"})
		return
	}

	// 验证帖子数据
	if post.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "内容不能为空"})
		return
	}

	// 设置默认作者名称（如果没有提供）
	if post.Author == "" {
		post.Author = "匿名用户"
	}

	// 使用CST时区创建当前时间
	now := utils.NowCST()
	
	// 计算删除时间（当前时间 + 不活跃天数）
	deleteAt := now.AddDate(0, 0, utils.Config.InactiveDaysBeforeDelete)

	// 存储新帖子，包含删除时间
	result, err := database.DB.Exec(
		"INSERT INTO posts (content, author, created_at, delete_at) VALUES (?, ?, ?, ?)",
		post.Content, post.Author, utils.FormatTimeCST(now), utils.FormatTimeCST(deleteAt))
	if err != nil {
		log.Printf("创建帖子失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	postID, _ := result.LastInsertId()
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "帖子创建成功",
		"post_id": postID,
	})
}

// GetAllPosts 获取所有帖子
func GetAllPosts(c *gin.Context) {
	// 获取当前时间，用于过滤已过期的帖子
	now := utils.NowCST()
	nowStr := utils.FormatTimeCST(now)
	
	// 查询未过期的帖子，使用delete_at字段判断
	rows, err := database.DB.Query(`
		SELECT id, content, author, created_at, delete_at
		FROM posts
		WHERE delete_at > ?
		ORDER BY created_at DESC
	`, nowStr)
	if err != nil {
		log.Printf("查询帖子失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		var createdAt string
		var deleteAt string
		err := rows.Scan(&post.ID, &post.Content, &post.Author, &createdAt, &deleteAt)
		if err != nil {
			log.Printf("扫描帖子数据失败: %v", err)
			continue
		}
		
		t, err := utils.ParseTimeCST(createdAt)
		if err != nil {
			log.Printf("解析创建时间失败: %v", err)
			// 使用当前时间作为后备
			t = utils.NowCST()
		}
		post.CreatedAt = t
		
		// 解析删除时间
		dt, err := utils.ParseTimeCST(deleteAt)
		if err != nil {
			log.Printf("解析删除时间失败: %v", err)
			// 使用创建时间加上默认过期天数作为后备
			dt = t.AddDate(0, 0, utils.Config.InactiveDaysBeforeDelete)
		}
		post.DeleteAt = dt
		
		posts = append(posts, post)
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}

// GetPostByID 获取单个帖子及其评论
func GetPostByID(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的帖子ID"})
		return
	}
	
	// 获取当前时间，用于过滤已过期的帖子
	now := utils.NowCST()
	nowStr := utils.FormatTimeCST(now)
	
	// 查询帖子，使用delete_at字段判断是否过期
	var post models.Post
	var createdAt string
	var deleteAt string
	err = database.DB.QueryRow(`
		SELECT id, content, author, created_at, delete_at
		FROM posts
		WHERE id = ? AND delete_at > ?
	`, postID, nowStr).Scan(&post.ID, &post.Content, &post.Author, &createdAt, &deleteAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "帖子不存在或已过期"})
			return
		}
		log.Printf("查询帖子失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	t, err := utils.ParseTimeCST(createdAt)
	if err != nil {
		log.Printf("解析帖子创建时间失败: %v", err)
		// 使用当前时间作为后备
		t = utils.NowCST()
	}
	post.CreatedAt = t
	
	// 解析删除时间
	dt, err := utils.ParseTimeCST(deleteAt)
	if err != nil {
		log.Printf("解析删除时间失败: %v", err)
		// 使用创建时间加上默认过期天数作为后备
		dt = t.AddDate(0, 0, utils.Config.InactiveDaysBeforeDelete)
	}
	post.DeleteAt = dt

	// 查询评论
	rows, err := database.DB.Query(`
		SELECT id, content, author, created_at 
		FROM comments
		WHERE post_id = ?
		ORDER BY created_at ASC
	`, postID)
	if err != nil {
		log.Printf("查询评论失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		var commentCreatedAt string
		err := rows.Scan(&comment.ID, &comment.Content, &comment.Author, &commentCreatedAt)
		if err != nil {
			log.Printf("扫描评论数据失败: %v", err)
			continue
		}
		comment.PostID = postID
		t, err := utils.ParseTimeCST(commentCreatedAt)
		if err != nil {
			log.Printf("解析评论时间失败: %v", err)
			// 使用当前时间作为后备
			t = utils.NowCST()
		}
		comment.CreatedAt = t
		comments = append(comments, comment)
	}

	post.Comments = comments

	c.JSON(http.StatusOK, gin.H{
		"post": post,
	})
}