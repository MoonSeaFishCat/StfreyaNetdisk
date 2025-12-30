package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/service"
)

// AdminMiddleware 检查是否为管理员
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")
		var user model.User
		if err := model.DB.First(&user, userID).Error; err != nil || user.Role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// ListUsers 管理员获取用户列表
func ListUsers(c *gin.Context) {
	var users []model.User
	model.DB.Find(&users)
	c.JSON(http.StatusOK, gin.H{"data": users})
}

// UpdateUserQuota 更新用户配额
func UpdateUserQuota(c *gin.Context) {
	var req struct {
		UserID    uint  `json:"userId"`
		TotalSize int64 `json:"totalSize"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := model.DB.Model(&model.User{}).Where("id = ?", req.UserID).Update("total_size", req.TotalSize).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

// UpdateUserAdmin 管理员更新用户信息
func UpdateUserAdmin(c *gin.Context) {
	var req struct {
		UserID uint   `json:"userId"`
		Role   string `json:"role"`
		Status int    `json:"status"`
		Coin   int    `json:"coin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := model.DB.Model(&model.User{}).Where("id = ?", req.UserID).Updates(map[string]interface{}{
		"role":   req.Role,
		"status": req.Status,
		"coin":   req.Coin,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

// DeleteUser 管理员删除用户
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	// 简单检查，防止删除自己
	adminID := c.GetUint("userID")
	if strconv.FormatUint(uint64(adminID), 10) == id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能删除自己"})
		return
	}

	if err := model.DB.Delete(&model.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// ListAllShares 管理员获取所有分享列表
func ListAllShares(c *gin.Context) {
	var shares []struct {
		model.Share
		FileName string `json:"fileName"`
		Username string `json:"username"`
	}

	err := model.DB.Table("shares").
		Select("shares.*, files.name as file_name, users.username").
		Joins("left join files on files.id = shares.file_id").
		Joins("left join users on users.id = shares.user_id").
		Where("shares.deleted_at IS NULL").
		Order("shares.created_at desc").
		Find(&shares).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": shares})
}

// DeleteShareAdmin 管理员强制删除分享
func DeleteShareAdmin(c *gin.Context) {
	id := c.Param("id")
	if err := model.DB.Delete(&model.Share{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// CleanRecycleBinAdmin 管理员手动清理回收站
func CleanRecycleBinAdmin(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "30")
	days, _ := strconv.Atoi(daysStr)

	count, err := service.CleanRecycleBin(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "清理失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "清理完成", "count": count})
}

// ListAllInvitationCodes 管理员获取所有邀请码
func ListAllInvitationCodes(c *gin.Context) {
	var codes []struct {
		model.InvitationCode
		CreatorName string `json:"creatorName"`
		UsedByName  string `json:"usedByName"`
	}

	err := model.DB.Table("invitation_codes").
		Select("invitation_codes.*, creators.username as creator_name, users.username as used_by_name").
		Joins("left join users as creators on creators.id = invitation_codes.creator_id").
		Joins("left join users on users.id = invitation_codes.used_by_id").
		Where("invitation_codes.deleted_at IS NULL").
		Order("invitation_codes.created_at desc").
		Find(&codes).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": codes})
}

// DeleteInvitationCodeAdmin 管理员删除邀请码
func DeleteInvitationCodeAdmin(c *gin.Context) {
	id := c.Param("id")
	if err := model.DB.Delete(&model.InvitationCode{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// BatchGenerateInvitationCodesAdmin 管理员批量生成邀请码
func BatchGenerateInvitationCodesAdmin(c *gin.Context) {
	var req struct {
		Count int `json:"count"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	userID := c.GetUint("userID")
	codes, err := service.BatchGenerateInvitationCodes(req.Count, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("成功生成 %d 个邀请码", len(codes)),
		"data":    codes,
	})
}

// ListPolicies 获取存储策略列表
func ListPolicies(c *gin.Context) {
	var policies []model.StoragePolicy
	model.DB.Find(&policies)
	c.JSON(http.StatusOK, gin.H{"data": policies})
}

// CreatePolicy 创建存储策略
func CreatePolicy(c *gin.Context) {
	var policy model.StoragePolicy
	if err := c.ShouldBindJSON(&policy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := model.DB.Create(&policy).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "创建成功"})
}

// UpdatePolicy 更新存储策略
func UpdatePolicy(c *gin.Context) {
	id := c.Param("id")
	var req model.StoragePolicy
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := model.DB.Model(&model.StoragePolicy{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":       req.Name,
		"type":       req.Type,
		"config":     req.Config,
		"is_default": req.IsDefault,
		"status":     req.Status,
		"base_url":   req.BaseURL,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

// DeletePolicy 删除存储策略
func DeletePolicy(c *gin.Context) {
	id := c.Param("id")
	// 检查是否有文件正在使用该策略
	var count int64
	model.DB.Model(&model.File{}).Where("policy_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该策略下仍有文件，无法删除"})
		return
	}

	if err := model.DB.Delete(&model.StoragePolicy{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// GetSystemStats 获取系统统计信息
func GetSystemStats(c *gin.Context) {
	var userCount int64
	var fileCount int64
	var totalStorage int64
	var shareCount int64
	var totalCoins int64
	var invitationCount int64

	model.DB.Model(&model.User{}).Count(&userCount)
	model.DB.Model(&model.File{}).Count(&fileCount)
	model.DB.Model(&model.Share{}).Count(&shareCount)
	model.DB.Model(&model.File{}).Select("SUM(size)").Scan(&totalStorage)
	model.DB.Model(&model.User{}).Select("SUM(coin)").Scan(&totalCoins)
	model.DB.Model(&model.InvitationCode{}).Count(&invitationCount)

	var recentUsers []model.User
	model.DB.Order("created_at desc").Limit(5).Find(&recentUsers)

	var recentFiles []struct {
		model.File
		Username string `json:"username"`
	}
	model.DB.Table("files").
		Select("files.*, users.username").
		Joins("left join users on users.id = files.user_id").
		Where("files.is_folder = ?", false).
		Order("files.created_at desc").
		Limit(5).
		Find(&recentFiles)

	c.JSON(http.StatusOK, gin.H{
		"userCount":       userCount,
		"fileCount":       fileCount,
		"totalStorage":    totalStorage,
		"shareCount":      shareCount,
		"totalCoins":      totalCoins,
		"invitationCount": invitationCount,
		"recentUsers":     recentUsers,
		"recentFiles":     recentFiles,
	})
}

// ListConfigs 获取系统配置列表
func ListConfigs(c *gin.Context) {
	var configs []model.Config
	model.DB.Find(&configs)
	c.JSON(http.StatusOK, gin.H{"data": configs})
}

// UpdateConfigs 批量更新系统配置
func UpdateConfigs(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	tx := model.DB.Begin()
	for key, value := range req {
		if err := tx.Model(&model.Config{}).Where("`key` = ?", key).Update("value", value).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新配置失败: " + key})
			return
		}
	}
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "配置更新成功"})
}
