package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/api"
	"github.com/stfreya/stfreyanetdisk/config"
	"github.com/stfreya/stfreyanetdisk/middleware"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/service"
	"github.com/stfreya/stfreyanetdisk/utils"
)

func main() {
	// 初始化配置
	config.InitConfig()

	// 初始化数据库
	model.InitDB()

	// 初始化搜索索引
	if err := utils.InitSearch("data/index.bleve"); err != nil {
		log.Printf("初始化搜索索引失败: %v", err)
	}

	// 启动后台任务
	service.StartBackgroundTasks()

	// 初始化 Gin 引擎
	r := gin.Default()

	// 注册全局中间件
	r.Use(middleware.CorsMiddleware())

	// 路由组
	v1 := r.Group("/api/v1")
	{
		// 公开接口 (认证相关)
		auth := v1.Group("/auth")
		{
			auth.GET("/captcha", api.GetCaptcha)
			auth.GET("/config", api.GetPublicConfigs)
			auth.POST("/register", api.Register)
			auth.POST("/login", api.Login)
		}

		// 分享相关接口 (公开)
		share := v1.Group("/share")
		{
			share.GET("/info/:token", api.GetShare)
			share.GET("/list/:token", api.GetShareFolderList)
			share.POST("/verify/:token", api.VerifySharePassword)
			share.GET("/download/:token", api.DownloadShare)
			share.POST("/save/:token", middleware.AuthMiddleware(), api.SaveShare)
		}

		// 文件管理接口 (需要认证)
		file := v1.Group("/file")
		file.Use(middleware.AuthMiddleware())
		{
			file.GET("/list", api.ListFiles)
			file.GET("/favorites", api.ListFavorites)
			file.POST("/folder", api.CreateFolder)
			file.POST("/upload", api.UploadFile)
			file.POST("/share", api.CreateShare)
			file.POST("/favorite/:id", api.ToggleFavorite)
			file.DELETE("/:id", api.DeleteFile)
			file.GET("/preview/:id", api.PreviewFile)
			file.POST("/save/:id", api.SaveFileContent)
			file.PUT("/rename/:id", api.RenameFile)
			file.PUT("/move/:id", api.MoveFile)
			file.POST("/batch/download", api.BatchDownloadFiles)
			file.GET("/search", api.SearchFiles)
			file.GET("/recycle", api.ListRecycleBin)
			file.POST("/restore/:id", api.RestoreFile)
			file.DELETE("/permanent/:id", api.PermanentDeleteFile)
			file.GET("/versions/:id", api.ListFileVersions)
			file.POST("/version/restore/:id", api.RestoreFileVersion)
		}

		// 管理员接口
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), api.AdminMiddleware())
		{
			admin.GET("/users", api.ListUsers)
			admin.POST("/user/quota", api.UpdateUserQuota)
			admin.GET("/policies", api.ListPolicies)
			admin.POST("/policy", api.CreatePolicy)
			admin.GET("/stats", api.GetSystemStats)
			admin.GET("/configs", api.ListConfigs)
			admin.POST("/configs", api.UpdateConfigs)
			admin.POST("/recycle/clean", api.CleanRecycleBinAdmin)
			admin.GET("/shares", api.ListAllShares)
			admin.DELETE("/share/:id", api.DeleteShareAdmin)
			admin.GET("/invites", api.ListAllInvitationCodes)
			admin.POST("/invite/generate", api.BatchGenerateInvitationCodesAdmin)
			admin.DELETE("/invite/:id", api.DeleteInvitationCodeAdmin)
		}

		// 用户相关接口 (需要认证)
		user := v1.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			user.GET("/info", api.GetUserInfo)
			user.PUT("/profile", api.UpdateProfile)
			user.POST("/signin", api.UserSignIn)
			user.POST("/invite/generate", api.GenerateInvitationCode)
			user.GET("/invite/list", api.ListUserInvitationCodes)
			user.GET("/shares", api.ListUserShares)
			user.DELETE("/share/:id", api.DeleteUserShare)
			user.GET("/transactions", api.GetUserTransactions)
			user.GET("/ping", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "auth success"})
			})
		}
	}

	// WebDAV 接口
	r.Any("/webdav/*any", api.WebDAVHandler())

	// 基础健康检查
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
			"status":  "StfreyaNetdisk 后端运行中",
		})
	})

	port := config.GlobalConfig.Port
	log.Printf("服务器启动在端口 %s", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
