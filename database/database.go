package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

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

	// 删除旧的帖子表
	_, err = DB.Exec(`DROP TABLE IF EXISTS comments`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`DROP TABLE IF EXISTS posts`)
	if err != nil {
		return err
	}

	// 创建新的帖子表 - 不包含标题字段
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