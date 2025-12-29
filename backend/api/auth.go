package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/service"
	"github.com/stfreya/stfreyanetdisk/utils"
)

// GetCaptcha 获取验证码
func GetCaptcha(c *gin.Context) {
	id, b64s, err := utils.GenerateCaptcha()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "验证码生成失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"captchaId":  id,
		"captchaImg": b64s,
	})
}

// GetPublicConfigs 获取公开系统配置
func GetPublicConfigs(c *gin.Context) {
	keys := []string{"site_name", "site_announcement", "allow_register"}
	var configs []model.Config
	model.DB.Where("`key` IN ?", keys).Find(&configs)

	res := make(map[string]string)
	for _, cfg := range configs {
		res[cfg.Key] = cfg.Value
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// Register 注册接口
func Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := service.Register(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "注册成功，欢迎加入圣芙蕾雅学院"})
}

// Login 登录接口
func Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, user, err := service.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var fileCount int64
	model.DB.Model(&model.File{}).Where("user_id = ?", user.ID).Count(&fileCount)

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"role":      user.Role,
			"coin":      user.Coin,
			"avatar":    user.Avatar,
			"usedSize":  user.UsedSize,
			"totalSize": user.TotalSize,
			"fileCount": fileCount,
		},
	})
}

// GetUserInfo 获取用户信息
func GetUserInfo(c *gin.Context) {
	userID := c.GetUint("userID")
	var user model.User
	if err := model.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	var fileCount int64
	model.DB.Model(&model.File{}).Where("user_id = ?", userID).Count(&fileCount)

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"role":      user.Role,
			"coin":      user.Coin,
			"avatar":    user.Avatar,
			"usedSize":  user.UsedSize,
			"totalSize": user.TotalSize,
			"fileCount": fileCount,
		},
	})
}
