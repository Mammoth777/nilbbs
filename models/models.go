package models

import (
	"time"
)

// Post 帖子模型
type Post struct {
	ID        int64     `json:"id"`
	Content   string    `json:"content"`
	Author    string    `json:"author"`
	CreatedAt time.Time `json:"created_at"`
	DeleteAt  time.Time `json:"delete_at"`
	Comments  []Comment `json:"comments,omitempty"`
}

// Comment 评论模型
type Comment struct {
	ID        int64     `json:"id"`
	Content   string    `json:"content"`
	PostID    int64     `json:"post_id"`
	Author    string    `json:"author"`
	CreatedAt time.Time `json:"created_at"`
}