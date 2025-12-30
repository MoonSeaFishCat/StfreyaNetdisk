package model

import "gorm.io/gorm"

// Message 消息通知模型
type Message struct {
	gorm.Model
	UserID  uint   `json:"user_id" gorm:"index"`
	Title   string `json:"title"`
	Content string `json:"content"`
	Type    string `json:"type"`    // info, success, warning, error
	IsRead  bool   `json:"is_read" gorm:"default:false"`
}
