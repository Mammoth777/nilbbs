package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/Mammoth777/nilbbs/database"
	"github.com/Mammoth777/nilbbs/models"
	"github.com/Mammoth777/nilbbs/utils"
	"github.com/gin-gonic/gin"
)

// AddComment 添加评论
func AddComment(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseInt(postIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的帖子ID"})
		return
	}

	var comment models.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据"})
		return
	}

	// 验证评论数据
	if comment.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "评论内容不能为空"})
		return
	}

	// 设置默认作者名称（如果没有提供）
	if comment.Author == "" {
		comment.Author = "匿名用户"
	}

	// 使用CST时区创建当前时间
	now := utils.NowCST()

	// 存储新评论
	result, err := database.DB.Exec(
		"INSERT INTO comments (content, post_id, author, created_at) VALUES (?, ?, ?, ?)",
		comment.Content, postID, comment.Author, utils.FormatTimeCST(now))
	if err != nil {
		log.Printf("创建评论失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	commentID, _ := result.LastInsertId()
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "评论添加成功",
		"comment_id": commentID,
	})
}