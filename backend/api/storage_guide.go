package api

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/driver"
	"github.com/stfreya/stfreyanetdisk/model"
)

// TestStorageConfigRequest 测试存储配置请求
type TestStorageConfigRequest struct {
	Type   string `json:"type"`
	Config string `json:"config"`
}

// TestStorageConnection 测试存储连接
func TestStorageConnection(c *gin.Context) {
	var req TestStorageConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 临时创建一个 policy 对象用于获取 driver
	policy := model.StoragePolicy{
		Type:   req.Type,
		Config: req.Config,
	}

	d, err := driver.GetDriver(&policy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "初始化驱动失败: " + err.Error()})
		return
	}

	// 通过尝试判断是否存在根目录或列出文件来测试连接
	// 这里简单起见，调用 Exists(".")
	_, err = d.Exists(".")
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "连接测试失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "连接测试成功"})
}

// GetStorageTemplates 获取存储配置模板（引导式安装使用）
func GetStorageTemplates(c *gin.Context) {
	templates := map[string]interface{}{
		"local": map[string]string{
			"root": "data/uploads",
		},
		"s3": map[string]string{
			"endpoint":   "",
			"accessKey":  "",
			"secretKey":  "",
			"bucket":     "",
			"region":     "us-east-1",
		},
		"oss": map[string]string{
			"endpoint":  "",
			"accessKey": "",
			"secretKey": "",
			"bucket":    "",
		},
		"cos": map[string]string{
			"bucketUrl": "",
			"secretId":  "",
			"secretKey": "",
		},
		"onedrive": map[string]string{
			"client_id":     "",
			"client_secret": "",
			"refresh_token": "",
			"root_path":     "/",
		},
	}
	c.JSON(http.StatusOK, gin.H{"data": templates})
}
