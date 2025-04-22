// filepath: /Users/hjq/work/open-source/nilbbs/utils/scheduler.go
package utils

import (
	"log"
	"sync"
	"time"
)

// 定时任务结构
type ScheduledTask struct {
	Interval     time.Duration // 任务执行的间隔时间
	TaskFunc     func()        // 要执行的任务函数
	stopChan     chan struct{} // 停止信号通道
	wg           sync.WaitGroup // 等待组，用于优雅关闭
	RunOnStartup bool          // 是否在启动时立即执行一次
}

// 创建新的定时任务
func NewScheduledTask(interval time.Duration, taskFunc func()) *ScheduledTask {
	return &ScheduledTask{
		Interval:     interval,
		TaskFunc:     taskFunc,
		stopChan:     make(chan struct{}),
		RunOnStartup: false, // 默认不在启动时立即执行
	}
}

// 启动定时任务
func (st *ScheduledTask) Start() {
	st.wg.Add(1)
	go func() {
		defer st.wg.Done()
		
		 // 如果配置了启动时执行，则立即执行一次任务
		if st.RunOnStartup {
			st.TaskFunc()
		}
		
		// 创建一个定时器
		ticker := time.NewTicker(st.Interval)
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				// 定时器触发，执行任务
				st.TaskFunc()
			case <-st.stopChan:
				// 收到停止信号，退出循环
				log.Println("定时任务已停止")
				return
			}
		}
	}()
	
	log.Printf("定时任务已启动，间隔: %v, 启动时执行: %v", st.Interval, st.RunOnStartup)
}

// 停止定时任务
func (st *ScheduledTask) Stop() {
	close(st.stopChan)
	st.wg.Wait()
}