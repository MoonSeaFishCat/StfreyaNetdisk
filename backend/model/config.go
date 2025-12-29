package model

import (
	"gorm.io/gorm"
)

// Config 系统配置模型
type Config struct {
	gorm.Model
	Key         string `gorm:"type:varchar(100);uniqueIndex;not null;comment:配置项键"`
	Value       string `gorm:"type:text;comment:配置项值"`
	Description string `gorm:"type:varchar(255);comment:描述"`
	Type        string `gorm:"type:varchar(20);default:'string';comment:值类型: string, int, bool"`
}

// GetConfig 获取配置值
func GetConfig(key string, defaultValue string) string {
	var config Config
	if err := DB.Where("`key` = ?", key).First(&config).Error; err != nil {
		return defaultValue
	}
	return config.Value
}

// SetConfig 设置配置值
func SetConfig(key string, value string, description string, valType string) error {
	var config Config
	result := DB.Where("`key` = ?", key).First(&config)
	
	if result.Error != nil {
		// 不存在则创建
		config = Config{
			Key:         key,
			Value:       value,
			Description: description,
			Type:        valType,
		}
		return DB.Create(&config).Error
	}
	
	// 存在则更新
	return DB.Model(&config).Update("value", value).Error
}
