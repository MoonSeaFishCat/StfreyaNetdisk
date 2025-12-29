package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/driver"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/service"
	"github.com/stfreya/stfreyanetdisk/utils"
)

// ListFiles 获取文件列表
func ListFiles(c *gin.Context) {
	userID := c.GetUint("userID")
	parentIDStr := c.DefaultQuery("parentId", "0")
	parentID, _ := strconv.ParseUint(parentIDStr, 10, 32)

	files, err := service.ListFiles(userID, uint(parentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": files,
	})
}

// CreateFolder 创建文件夹
func CreateFolder(c *gin.Context) {
	userID := c.GetUint("userID")
	var req struct {
		ParentID uint   `json:"parentId"`
		Name     string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := service.CreateFolder(userID, req.ParentID, req.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "创建成功"})
}

// UploadFile 上传文件
func UploadFile(c *gin.Context) {
	userID := c.GetUint("userID")
	parentIDStr := c.PostForm("parentId")
	parentID, _ := strconv.ParseUint(parentIDStr, 10, 32)
	hash := c.PostForm("hash") // 接收前端传来的哈希，支持秒传

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择文件"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer src.Close()

	if err := service.UploadFile(userID, uint(parentID), file.Filename, file.Size, src, hash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "上传成功"})
}

// ToggleFavorite 切换收藏状态
func ToggleFavorite(c *gin.Context) {
	userID := c.GetUint("userID")
	fileID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var file model.File
	if err := model.DB.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	if err := model.DB.Model(&file).Update("is_favorite", !file.IsFavorite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "操作成功", "isFavorite": !file.IsFavorite})
}

// ListFavorites 获取收藏列表
func ListFavorites(c *gin.Context) {
	userID := c.GetUint("userID")
	var files []model.File
	if err := model.DB.Where("user_id = ? AND is_favorite = ? AND deleted_at IS NULL", userID, true).Find(&files).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取列表失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": files})
}

// DeleteFile 删除文件/文件夹 (进入回收站)
func DeleteFile(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	if err := service.DeleteFile(userID, uint(fileID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// PreviewFile 预览文件
func PreviewFile(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	var file model.File
	if err := model.DB.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	// 获取存储策略
	var policy model.StoragePolicy
	if err := model.DB.First(&policy, file.PolicyID).Error; err != nil {
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
	reader, err := d.Get(file.Path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件获取失败"})
		return
	}
	defer reader.Close()

	// 根据扩展名设置 Content-Type
	contentType := "application/octet-stream"
	switch file.Ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".gif":
		contentType = "image/gif"
	case ".txt":
		contentType = "text/plain; charset=utf-8"
	case ".pdf":
		contentType = "application/pdf"
	case ".mp4":
		contentType = "video/mp4"
	}

	c.DataFromReader(http.StatusOK, file.Size, contentType, reader, nil)
}

// RenameFile 重命名文件
func RenameFile(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := service.RenameFile(userID, uint(fileID), req.Name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "重命名成功"})
}

// MoveFile 移动文件
func MoveFile(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	var req struct {
		ParentID uint `json:"parentId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := service.MoveFile(userID, uint(fileID), req.ParentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "移动成功"})
}

// ListRecycleBin 获取回收站列表
func ListRecycleBin(c *gin.Context) {
	userID := c.GetUint("userID")
	files, err := service.ListRecycleBin(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取回收站列表失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": files})
}

// SaveFileContent 保存文件内容 (仅限文本文件)
func SaveFileContent(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := service.SaveFileContent(userID, uint(fileID), req.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "保存成功"})
}

// RestoreFile 还原文件
func RestoreFile(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	if err := service.RestoreFile(userID, uint(fileID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "还原成功"})
}

// PermanentDeleteFile 彻底删除文件
func PermanentDeleteFile(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	if err := service.PermanentDeleteFile(userID, uint(fileID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "彻底删除成功"})
}

// ListFileVersions 获取文件版本列表
func ListFileVersions(c *gin.Context) {
	userID := c.GetUint("userID")
	fileIDStr := c.Param("id")
	fileID, _ := strconv.ParseUint(fileIDStr, 10, 32)

	versions, err := service.ListFileVersions(userID, uint(fileID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": versions})
}

// RestoreFileVersion 还原文件版本
func RestoreFileVersion(c *gin.Context) {
	userID := c.GetUint("userID")
	versionIDStr := c.Param("id")
	versionID, _ := strconv.ParseUint(versionIDStr, 10, 32)

	if err := service.RestoreFileVersion(userID, uint(versionID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "版本还原成功"})
}

// BatchDownloadFiles 批量下载文件
func BatchDownloadFiles(c *gin.Context) {
	userID := c.GetUint("userID")
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=batch_download.zip")
	c.Header("Content-Type", "application/zip")

	if err := service.BatchDownloadFiles(userID, req.IDs, c.Writer); err != nil {
		// 注意：如果已经开始写入响应头，报错可能无法正常返回JSON
		return
	}
}

// SearchFiles 搜索文件
func SearchFiles(c *gin.Context) {
	userID := c.GetUint("userID")
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "关键字不能为空"})
		return
	}

	// 1. 调用全文检索索引
	fileIDs, err := utils.SearchFiles(userID, keyword)
	if err != nil {
		// 如果索引搜索失败，降级到数据库模糊搜索
		files, _ := service.SearchFiles(userID, keyword)
		c.JSON(http.StatusOK, gin.H{"data": files})
		return
	}

	// 2. 根据索引返回的 ID 查询文件详情
	var files []model.File
	if len(fileIDs) > 0 {
		model.DB.Where("id IN ? AND user_id = ?", fileIDs, userID).Find(&files)
	}

	// 3. 如果全文检索结果较少，可以补充数据库模糊搜索的结果
	if len(files) < 10 {
		dbFiles, _ := service.SearchFiles(userID, keyword)
		// 合并结果并去重
		idMap := make(map[uint]bool)
		for _, f := range files {
			idMap[f.ID] = true
		}
		for _, f := range dbFiles {
			if !idMap[f.ID] {
				files = append(files, f)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": files})
}
