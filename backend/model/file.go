package model

import (
	"gorm.io/gorm"
)

// File 文件/文件夹模型
type File struct {
	gorm.Model
	Name       string `gorm:"type:varchar(255);not null;index;comment:文件名称"`
	Size       int64  `gorm:"comment:文件大小(字节)"`
	Hash       string `gorm:"type:varchar(64);index;comment:文件哈希(SHA256)"`
	Path       string `gorm:"type:varchar(512);comment:存储路径"`
	Ext        string `gorm:"type:varchar(20);comment:扩展名"`
	IsFolder   bool   `gorm:"default:false;comment:是否为文件夹"`
	ParentID   uint   `gorm:"default:0;index;comment:父级目录ID"`
	UserID     uint   `gorm:"index;comment:创建者ID"`
	PolicyID   uint   `gorm:"comment:存储策略ID"`
	IsFavorite bool   `gorm:"default:false;index;comment:是否收藏"`
}

// FileVersion 文件历史版本
type FileVersion struct {
	gorm.Model
	FileID   uint   `gorm:"index;comment:所属文件ID"`
	Size     int64  `gorm:"comment:版本大小"`
	Path     string `gorm:"type:varchar(512);comment:版本存储路径"`
	Hash     string `gorm:"type:varchar(64);comment:版本哈希"`
	PolicyID uint   `gorm:"comment:版本存储策略ID"`
}
