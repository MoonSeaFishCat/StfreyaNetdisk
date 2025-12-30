package model

import (
	"fmt"
	"log"

	"github.com/stfreya/stfreyanetdisk/config"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	cfg := config.GlobalConfig
	// 拼接 MySQL DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPass, cfg.DBHost, cfg.DBPort, cfg.DBName)

	var err error
	// 连接数据库
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 自动迁移表结构
	err = DB.AutoMigrate(
		&User{},
		&UserTransaction{},
		&File{},
		&FileVersion{},
		&StoragePolicy{},
		&Share{},
		&InvitationCode{},
		&Config{},
		&Message{},
	)
	if err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	log.Println("数据库连接已建立，表结构迁移完成")

	// 初始化默认系统配置
	initDefaultConfigs()

	// 初始化管理员账号 (如果没有管理员)
	var count int64
	DB.Model(&User{}).Where("role = ?", "admin").Count(&count)
	if count == 0 {
		log.Println("没有发现管理员账号，正在初始化默认管理员...")
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		adminAccount := User{
			Username:  "admin",
			Password:  string(hashedPassword),
			Email:     "admin@stfreya.com",
			Role:      "admin",
			Status:    1,
			TotalSize: 100 * 1024 * 1024 * 1024, // 100GB
			Coin:      99999,
		}
		if err := DB.Create(&adminAccount).Error; err != nil {
			log.Printf("初始化管理员账号失败: %v", err)
		} else {
			log.Println("默认管理员账号初始化成功: admin / admin123")
		}
	}
}

type StoragePolicy struct {
	gorm.Model
	Name      string `gorm:"size:100;not null;comment:策略名称"`
	Type      string `gorm:"size:20;comment:存储类型(local,s3,oss,cos,sftp,onedrive)"`
	Config    string `gorm:"type:text;comment:配置信息(json)"`
	IsDefault bool   `gorm:"default:false;comment:是否默认"`
	Status    int    `gorm:"default:1;comment:状态(1:启用, 0:禁用)"`
	BaseURL   string `gorm:"size:255;comment:直链基础URL"`
}

func initDefaultConfigs() {
	configs := []Config{
		{Key: "site_name", Value: "Stfreya Netdisk", Description: "站点名称", Type: "string"},
		{Key: "site_announcement", Value: "欢迎来到圣芙蕾雅网盘！", Description: "站点公告", Type: "string"},
		{Key: "allow_register", Value: "true", Description: "是否允许注册", Type: "bool"},
		{Key: "default_quota", Value: "10737418240", Description: "默认用户配额(10GB)", Type: "int"},
		{Key: "signin_reward", Value: "5", Description: "每日签到奖励", Type: "int"},
		{Key: "invite_cost", Value: "10", Description: "生成邀请码成本", Type: "int"},
		{Key: "upload_reward", Value: "1", Description: "文件上传奖励", Type: "int"},
		{Key: "share_reward", Value: "2", Description: "创建分享奖励", Type: "int"},
		{Key: "quota_exchange_cost", Value: "10", Description: "1GB 空间兑换成本(学园币)", Type: "int"},
	}

	for _, cfg := range configs {
		var existing Config
		if err := DB.Where("`key` = ?", cfg.Key).First(&existing).Error; err != nil {
			DB.Create(&cfg)
		}
	}
}
