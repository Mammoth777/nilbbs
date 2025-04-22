package utils

import "time"

// CSTZone 中国标准时间时区 (UTC+8)
var CSTZone = time.FixedZone("CST", 8*3600)

// FormatTimeCST 将时间格式化为中国标准时间字符串
func FormatTimeCST(t time.Time) string {
	return t.In(CSTZone).Format("2006-01-02 15:04:05")
}

// ParseTimeCST 解析字符串为中国标准时间
func ParseTimeCST(timeStr string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02 15:04:05", timeStr, CSTZone)
}

// NowCST 返回当前的中国标准时间
func NowCST() time.Time {
	return time.Now().In(CSTZone)
}