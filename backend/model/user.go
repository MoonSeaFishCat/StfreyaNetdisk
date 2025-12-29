package model

import (
	"time"

	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	gorm.Model
	Username     string     `gorm:"type:varchar(100);uniqueIndex;not null;comment:用户名"`
	Password     string     `gorm:"type:varchar(255);not null;comment:密码哈希"`
	Email        string     `gorm:"type:varchar(100);uniqueIndex;comment:邮箱"`
	Avatar       string     `gorm:"type:varchar(255);comment:头像地址"`
	Role         string     `gorm:"type:varchar(20);default:'user';comment:角色: admin, user"`
	Status       int        `gorm:"type:tinyint;default:1;comment:状态: 1启用, 0禁用"`
	TotalSize    int64      `gorm:"default:10737418240;comment:总空间(默认10GB)"`
	UsedSize     int64      `gorm:"default:0;comment:已用空间"`
	Coin         int        `gorm:"default:0;comment:学园币余额"`
	LastSignInAt *time.Time `gorm:"comment:最后签到时间"`
}

// UserTransaction 账户流水
type UserTransaction struct {
	ID        uint   `gorm:"primaryKey"`
	UserID    uint   `gorm:"index;comment:用户ID"`
	Amount    int    `gorm:"comment:变动金额"`
	Type      string `gorm:"type:varchar(20);comment:类型: signin, invite, upgrade"`
	Remark    string `gorm:"type:varchar(255);comment:备注"`
	CreatedAt time.Time
}
