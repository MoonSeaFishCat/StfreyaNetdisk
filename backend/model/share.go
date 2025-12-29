package model

import (
	"time"

	"gorm.io/gorm"
)

// Share 分享链接模型
type Share struct {
	gorm.Model
	FileID     uint      `gorm:"index;comment:分享的文件ID"`
	UserID     uint      `gorm:"index;comment:分享者ID"`
	Password   string    `gorm:"type:varchar(20);comment:提取码"`
	ExpireTime *time.Time `gorm:"comment:过期时间"`
	Views      int       `gorm:"default:0;comment:访问次数"`
	Downloads  int       `gorm:"default:0;comment:下载次数"`
	IsPublic   bool      `gorm:"default:false;comment:是否公开"`
	Token      string    `gorm:"type:varchar(64);uniqueIndex;comment:分享令牌"`
}

// InvitationCode 邀请码模型
type InvitationCode struct {
	gorm.Model
	Code      string `gorm:"type:varchar(32);uniqueIndex;not null;comment:邀请码"`
	CreatorID uint   `gorm:"index;comment:创建者ID"`
	UsedByID  uint   `gorm:"index;comment:使用者ID"`
	Status    int    `gorm:"type:tinyint;default:0;comment:状态: 0未使用, 1已使用"`
}
