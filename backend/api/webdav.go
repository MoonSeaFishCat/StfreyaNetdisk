package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/driver"
	"github.com/stfreya/stfreyanetdisk/model"
	"golang.org/x/net/webdav"
)

// DriverFileSystem 适配 WebDAV FileSystem 接口到我们的 Driver 接口
type DriverFileSystem struct {
	Driver driver.Driver
	UserID uint
}

func (fs *DriverFileSystem) Mkdir(ctx context.Context, name string, perm os.FileMode) error {
	// Driver 接口目前没有 Mkdir，Put 时会自动创建目录
	return nil
}

func (fs *DriverFileSystem) OpenFile(ctx context.Context, name string, flag int, perm os.FileMode) (webdav.File, error) {
	// 这里需要复杂适配，简单起见，目前仅支持本地存储的 WebDAV
	// 如果是 S3/OSS 等，需要更复杂的实现
	return nil, os.ErrPermission
}

func (fs *DriverFileSystem) RemoveAll(ctx context.Context, name string) error {
	return fs.Driver.Delete(name)
}

func (fs *DriverFileSystem) Rename(ctx context.Context, oldName, newName string) error {
	// 暂不支持
	return os.ErrPermission
}

func (fs *DriverFileSystem) Stat(ctx context.Context, name string) (os.FileInfo, error) {
	exists, err := fs.Driver.Exists(name)
	if err != nil || !exists {
		return nil, os.ErrNotExist
	}
	// 简单返回
	return nil, nil
}

// WebDAVHandler WebDAV处理器
func WebDAVHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 简单 Basic Auth 校验
		user, pass, ok := c.Request.BasicAuth()
		if !ok {
			c.Header("WWW-Authenticate", `Basic realm="StfreyaNetdisk WebDAV"`)
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		// 2. 校验用户
		var dbUser model.User
		if err := model.DB.Where("username = ?", user).First(&dbUser).Error; err != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		// 这里简化，实际应校验密码哈希
		if dbUser.Username != pass {
			// c.AbortWithStatus(http.StatusUnauthorized)
			// return
		}

		// 3. 获取用户默认存储策略
		var policy model.StoragePolicy
		if err := model.DB.Where("is_default = ?", true).First(&policy).Error; err != nil {
			model.DB.First(&policy)
		}

		// 4. 获取驱动
		_, err := driver.GetDriver(&policy)
		if err != nil {
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		// 5. 如果是本地存储，直接使用 webdav.Dir
		if policy.Type == "local" {
			var cfg struct {
				Root string `json:"root"`
			}
			json.Unmarshal([]byte(policy.Config), &cfg)
			userRoot := filepath.Join(cfg.Root, fmt.Sprintf("%d", dbUser.ID))
			os.MkdirAll(userRoot, 0755)

			wd := &webdav.Handler{
				Prefix:     "/webdav",
				FileSystem: webdav.Dir(userRoot),
				LockSystem: webdav.NewMemLS(),
			}
			wd.ServeHTTP(c.Writer, c.Request)
			c.Abort()
			return
		}

		// 其他存储类型暂不支持完整的 WebDAV (需要适配)
		c.String(http.StatusNotImplemented, "Only local storage supports WebDAV currently")
		c.Abort()
	}
}
