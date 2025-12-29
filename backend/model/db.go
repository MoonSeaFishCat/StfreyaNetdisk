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
	)
	if err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	log.Println("数据库连接已建立，表结构迁移完成")

	// 初始化默认系统配置
	initDefaultConfigs()

	// 初始化管理员账号
	var admin User
	if e := DB.Where("username = ?", "admin").First(&admin).Error; e != nil {
		if e == gorm.ErrRecordNotFound {
			log.Println("正在初始化默认管理员账号...")
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
			if e2 := DB.Create(&adminAccount).Error; e2 != nil {
				log.Printf("初始化管理员账号失败: %v", e2)
			} else {
				log.Println("默认管理员账号初始化成功: admin / admin123")
			}
		}
	} else {
		// 校验现有管理员密码是否正确，不正确则重置为 admin123
		err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte("admin123"))
		if err != nil {
			log.Println("检测到管理员密码不匹配或哈希无效，正在重置为 admin123...")
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
			DB.Model(&admin).Update("password", string(hashedPassword))
			log.Println("管理员密码已重置为: admin123")
		}
	}
}

type StoragePolicy struct {
	gorm.Model
	Name      string `gorm:"size:100;not null;comment:策略名称"`
	Type      string `gorm:"size:20;comment:存储类型(local,s3,oss,cos)"`
	Config    string `gorm:"type:text;comment:配置信息(json)"`
	IsDefault bool   `gorm:"default:false;comment:是否默认"`
}

func initDefaultConfigs() {
	configs := []Config{
		{Key: "site_name", Value: "Stfreya Netdisk", Description: "站点名称", Type: "string"},
		{Key: "site_announcement", Value: "欢迎来到圣芙蕾雅网盘！", Description: "站点公告", Type: "string"},
		{Key: "allow_register", Value: "true", Description: "是否允许注册", Type: "bool"},
		{Key: "default_quota", Value: "10737418240", Description: "默认用户配额(10GB)", Type: "int"},
		{Key: "signin_reward", Value: "5", Description: "每日签到奖励", Type: "int"},
		{Key: "invite_cost", Value: "10", Description: "生成邀请码成本", Type: "int"},
	}

	for _, cfg := range configs {
		var existing Config
		if err := DB.Where("`key` = ?", cfg.Key).First(&existing).Error; err != nil {
			DB.Create(&cfg)
		}
	}
}
