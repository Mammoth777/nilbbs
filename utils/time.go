package utils

import "time"

// CSTZone 中国标准时间时区 (UTC+8)
var CSTZone = time.FixedZone("CST", 8*3600)

func SetCSTZone(t time.Time) time.Time {
	return t.In(CSTZone)
}

// FormatTimeCST 将时间格式化为中国标准时间字符串
func FormatTimeCST(t time.Time) string {
	return t.In(CSTZone).Format("2006-01-02 15:04:05")
}

// ParseTimeCST 解析字符串为中国标准时间
func ParseTimeCST(timeStr string) (time.Time, error) {
	// 2025-05-06T16:31:34Z
	t, err := time.Parse(time.RFC3339, timeStr)
	if err == nil {
		// 这里不使用 t.In(CSTZone)，而是创建一个新的时间，保持时间值不变，但更改时区
		// todo 可能是存的时候有点问题
		return time.Date(
			t.Year(), t.Month(), t.Day(),
			t.Hour(), t.Minute(), t.Second(), t.Nanosecond(),
			CSTZone,
		), nil
	}
	return time.Time{}, err
}

// NowCST 返回当前的中国标准时间
func NowCST() time.Time {
	return time.Now().In(CSTZone)
}
