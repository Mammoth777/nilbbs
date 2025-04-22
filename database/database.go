package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// 初始化数据库连接和表结构
func InitDB() error {
	// 确保数据目录存在
	dbDir := "./data"
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			return err
		}
	}

	dbPath := filepath.Join(dbDir, "nilbbs.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// 测试连接
	if err := db.Ping(); err != nil {
		return err
	}

	DB = db
	log.Println("成功连接到SQLite数据库")

	// 不再删除表，只在表不存在时创建它们

	// 创建帖子表 - 不包含标题字段
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS posts (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		content TEXT NOT NULL,
		author TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return err
	}

	// 创建评论表
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS comments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		content TEXT NOT NULL,
		post_id INTEGER NOT NULL,
		author TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (post_id) REFERENCES posts(id)
	)`)
	if err != nil {
		return err
	}

	log.Println("数据库表结构初始化完成")
	return nil
}

// 关闭数据库连接
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}

// 删除N天不活跃的帖子(创建超过N天且N天没有新评论的帖子)
func DeleteOldPosts(days int) (int64, error) {
	// 计算截止日期
	cutoffDate := time.Now().AddDate(0, 0, -days)
	
	// 开始事务
	tx, err := DB.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 查找不活跃的帖子ID：
	// 1. 帖子创建时间超过N天
	// 2. 且没有N天内的评论
	rows, err := tx.Query(`
		SELECT p.id FROM posts p 
		WHERE p.created_at < ? 
		AND NOT EXISTS (
			SELECT 1 FROM comments c 
			WHERE c.post_id = p.id AND c.created_at >= ?
		)`, cutoffDate, cutoffDate)
	
	if err != nil {
		return 0, err
	}
	
	var inactivePostIDs []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return 0, err
		}
		inactivePostIDs = append(inactivePostIDs, id)
	}
	rows.Close()
	
	if len(inactivePostIDs) == 0 {
		// 没有不活跃的帖子需要删除
		tx.Commit()
		return 0, nil
	}
	
	// 为SQL IN语句准备参数占位符
	placeholders := "?"
	args := make([]interface{}, len(inactivePostIDs))
	args[0] = inactivePostIDs[0]
	
	for i := 1; i < len(inactivePostIDs); i++ {
		placeholders += ",?"
		args[i] = inactivePostIDs[i]
	}
	
	// 删除这些不活跃帖子的评论
	_, err = tx.Exec("DELETE FROM comments WHERE post_id IN ("+placeholders+")", args...)
	if err != nil {
		return 0, err
	}
	
	// 删除不活跃的帖子
	result, err := tx.Exec("DELETE FROM posts WHERE id IN ("+placeholders+")", args...)
	if err != nil {
		return 0, err
	}
	
	// 提交事务
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	
	// 返回删除的帖子数量
	return result.RowsAffected()
}