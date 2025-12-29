package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/model"
	"golang.org/x/crypto/bcrypt"
)

// UpdateProfileRequest 更新资料请求
type UpdateProfileRequest struct {
	Email    string `json:"email"`
	Avatar   string `json:"avatar"`
	Password string `json:"password"`
}

// UpdateProfile 更新用户信息
func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("userID")
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	updates := make(map[string]interface{})
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}
	if req.Password != "" {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		updates["password"] = string(hashedPassword)
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "没有需要更新的内容"})
		return
	}

	if err := model.DB.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}
