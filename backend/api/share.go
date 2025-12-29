package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/driver"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/service"
)

// CreateShare 创建分享接口
func CreateShare(c *gin.Context) {
	userID := c.GetUint("userID")
	var req struct {
		FileID     uint   `json:"fileId" binding:"required"`
		Password   string `json:"password"`
		ExpireDays int    `json:"expireDays"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	token, err := service.CreateShare(userID, req.FileID, req.Password, req.ExpireDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}

// GetShare 获取分享接口
func GetShare(c *gin.Context) {
	token := c.Param("token")
	share, file, err := service.GetShare(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"share": gin.H{
			"id":          share.ID,
			"hasPassword": share.Password != "",
			"expireTime":  share.ExpireTime,
			"views":       share.Views,
		},
		"file": gin.H{
			"name": file.Name,
			"size": file.Size,
			"ext":  file.Ext,
		},
	})
}

// VerifySharePassword 校验分享提取码
func VerifySharePassword(c *gin.Context) {
	token := c.Param("token")
	var req struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	share, _, err := service.GetShare(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if share.Password != "" && share.Password != req.Password {
		c.JSON(http.StatusForbidden, gin.H{"error": "提取码错误"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "校验成功"})
}

// GetShareFolderList 获取分享文件夹中的文件列表
func GetShareFolderList(c *gin.Context) {
	token := c.Param("token")
	password := c.Query("password")
	parentIDStr := c.DefaultQuery("parentId", "0")
	parentID, _ := strconv.ParseUint(parentIDStr, 10, 32)

	share, rootFile, err := service.GetShare(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if share.Password != "" && share.Password != password {
		c.JSON(http.StatusForbidden, gin.H{"error": "提取码错误"})
		return
	}

	// 检查请求的 parentID 是否在分享的文件夹范围内
	actualParentID := uint(parentID)
	if actualParentID == 0 {
		actualParentID = share.FileID
	} else {
		// 这里简单校验：请求的文件夹必须属于原分享文件夹的子目录
		// 实际生产中应递归校验或检查路径前缀
		var targetFolder model.File
		if err := model.DB.First(&targetFolder, actualParentID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "目录不存在"})
			return
		}
		// 简单的安全校验：该文件夹的 UserID 必须与分享者一致
		if targetFolder.UserID != share.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "无权访问"})
			return
		}
	}

	var files []model.File
	if err := model.DB.Where("parent_id = ? AND user_id = ?", actualParentID, share.UserID).Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": files,
		"root": rootFile,
	})
}

// DownloadShare 下载分享文件
func DownloadShare(c *gin.Context) {
	token := c.Param("token")
	password := c.Query("password")
	fileIDStr := c.Query("fileId")

	share, rootFile, err := service.GetShare(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if share.Password != "" && share.Password != password {
		c.JSON(http.StatusForbidden, gin.H{"error": "提取码错误"})
		return
	}

	targetFile := rootFile
	if fileIDStr != "" {
		fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)
		var f model.File
		if e := model.DB.First(&f, uint(fileID)).Error; e != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
			return
		}
		// 校验文件是否属于分享者
		if f.UserID != share.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "无权访问"})
			return
		}
		targetFile = &f
	}

	if targetFile.IsFolder {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法直接下载文件夹"})
		return
	}

	// 获取存储策略
	var policy model.StoragePolicy
	if err = model.DB.First(&policy, targetFile.PolicyID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "存储策略获取失败"})
		return
	}

	// 获取驱动
	d, err := driver.GetDriver(&policy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 获取文件流
	reader, err := d.Get(targetFile.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件获取失败"})
		return
	}
	defer reader.Close()

	c.Header("Content-Disposition", "attachment; filename="+targetFile.Name)
	c.DataFromReader(http.StatusOK, targetFile.Size, "application/octet-stream", reader, nil)
}

// SaveShare 保存分享内容到自己的网盘
func SaveShare(c *gin.Context) {
	userID := c.GetUint("userID")
	token := c.Param("token")
	var req struct {
		Password string `json:"password"`
		ParentID uint   `json:"parentId"` // 保存到的目标目录
		FileID   uint   `json:"fileId"`   // 可选，如果分享的是文件夹，可以选择其中一个子文件/文件夹保存
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	share, rootFile, err := service.GetShare(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if share.Password != "" && share.Password != req.Password {
		c.JSON(http.StatusForbidden, gin.H{"error": "提取码错误"})
		return
	}

	targetFile := rootFile
	if req.FileID != 0 {
		var f model.File
		if err := model.DB.First(&f, req.FileID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
			return
		}
		// 校验文件是否属于分享者 (简单的安全校验)
		if f.UserID != share.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "无权访问"})
			return
		}
		targetFile = &f
	}

	// 执行保存逻辑 (递归复制文件记录)
	if err := service.CopyFile(targetFile, userID, req.ParentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "保存成功"})
}

// ListUserShares 获取当前用户的分享列表
func ListUserShares(c *gin.Context) {
	userID := c.GetUint("userID")
	var shares []struct {
		model.Share
		FileName string `json:"fileName"`
		FileSize int64  `json:"fileSize"`
	}

	err := model.DB.Table("shares").
		Select("shares.*, files.name as file_name, files.size as file_size").
		Joins("left join files on files.id = shares.file_id").
		Where("shares.user_id = ? AND shares.deleted_at IS NULL", userID).
		Order("shares.created_at desc").
		Find(&shares).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": shares})
}

// DeleteUserShare 删除用户自己的分享
func DeleteUserShare(c *gin.Context) {
	userID := c.GetUint("userID")
	shareID := c.Param("id")

	if err := model.DB.Where("id = ? AND user_id = ?", shareID, userID).Delete(&model.Share{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
