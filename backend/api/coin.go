package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/service"
)

// UserSignIn 用户签到接口
func UserSignIn(c *gin.Context) {
	userID := c.GetUint("userID")
	reward, err := service.SignIn(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("签到成功！获得 %d 个学园币", reward),
		"reward":  reward,
	})
}

// GenerateInvitationCode 生成邀请码接口
func GenerateInvitationCode(c *gin.Context) {
	userID := c.GetUint("userID")
	code, err := service.GenerateInvitationCode(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "邀请码生成成功！消耗了 10 个学园币",
		"code":    code,
	})
}

// GetUserTransactions 获取用户学园币流水
func GetUserTransactions(c *gin.Context) {
	userID := c.GetUint("userID")
	transactions, err := service.GetUserTransactions(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

// ListUserInvitationCodes 获取当前用户的邀请码列表
func ListUserInvitationCodes(c *gin.Context) {
	userID := c.GetUint("userID")
	var codes []struct {
		model.InvitationCode
		UsedByUsername string `json:"usedByUsername"`
	}

	err := model.DB.Table("invitation_codes").
		Select("invitation_codes.*, users.username as used_by_username").
		Joins("left join users on users.id = invitation_codes.used_by_id").
		Where("invitation_codes.creator_id = ? AND invitation_codes.deleted_at IS NULL", userID).
		Order("invitation_codes.created_at desc").
		Find(&codes).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": codes})
}
