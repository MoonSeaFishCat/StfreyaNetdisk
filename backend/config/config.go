package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	DBUser    string
	DBPass    string
	DBHost    string
	DBPort    string
	DBName    string
	JWTSecret string
	RedisHost string
	RedisPort string
	RedisPass string
}

var GlobalConfig *Config

func InitConfig() {
	// 加载 .env 配置文件
	err := godotenv.Load()
	if err != nil {
		log.Println("警告: 未找到 .env 文件，将使用系统环境变量")
	}

	GlobalConfig = &Config{
		Port:      getEnv("PORT", "8080"),
		DBUser:    getEnv("DB_USER", "root"),
		DBPass:    getEnv("DB_PASS", ""),
		DBHost:    getEnv("DB_HOST", "127.0.0.1"),
		DBPort:    getEnv("DB_PORT", "3306"),
		DBName:    getEnv("DB_NAME", "stfreyanetdisk"),
		JWTSecret: getEnv("JWT_SECRET", "stfreya_secret"),
		RedisHost: getEnv("REDIS_HOST", "127.0.0.1"),
		RedisPort: getEnv("REDIS_PORT", "6379"),
		RedisPass: getEnv("REDIS_PASS", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
