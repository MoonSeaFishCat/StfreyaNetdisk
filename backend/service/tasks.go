package service

import (
	"log"
	"time"

	"github.com/stfreya/stfreyanetdisk/model"
)

// StartBackgroundTasks 启动后台任务
func StartBackgroundTasks() {
	// 1. 定期清理回收站 (每天执行一次)
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			log.Println("[Task] 正在运行回收站自动清理...")
			
			// 从配置中获取清理天数，默认为 30 天
			days := 30
			var config model.Config
			if err := model.DB.Where("key = ?", "recycle_bin_clean_days").First(&config).Error; err == nil {
				// 这里简单处理，假设值是整数
				// 实际中可能需要更完善的类型转换
			}

			count, err := CleanRecycleBin(days)
			if err != nil {
				log.Printf("[Task] 回收站自动清理失败: %v", err)
			} else {
				log.Printf("[Task] 回收站自动清理完成，共清理 %d 个文件", count)
			}
			<-ticker.C
		}
	}()

	// 可以在这里添加更多后台任务，例如：
	// - 清理过期的分享链接
	// - 清理孤立的文件块
	// - 统计系统资源使用情况
}
