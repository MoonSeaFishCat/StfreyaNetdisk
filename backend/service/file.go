package service

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/stfreya/stfreyanetdisk/driver"
	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/utils"
	"gorm.io/gorm"
)

// SaveFileContent 保存文件内容（在线编辑）
func SaveFileContent(userID uint, fileID uint, content string) error {
	var file model.File
	if err := model.DB.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		return errors.New("文件不存在")
	}

	// 1. 获取存储策略
	var policy model.StoragePolicy
	if err := model.DB.First(&policy, file.PolicyID).Error; err != nil {
		return err
	}

	// 2. 获取驱动
	d, err := driver.GetDriver(&policy)
	if err != nil {
		return err
	}

	// 3. 记录旧版本
	oldPath := file.Path
	oldSize := file.Size

	// 为了简单起见，我们暂且把旧文件重命名作为版本
	// 实际生产中可能需要更复杂的路径管理
	versionPath := fmt.Sprintf("%s.v%d", oldPath, time.Now().Unix())

	// 这里我们需要先复制旧文件内容到新版本路径，或者通过驱动支持重命名
	// 由于我们的驱动接口目前只有 Put/Get/Delete，我们可以先读出旧内容再写入
	oldReader, err := d.Get(oldPath)
	if err == nil {
		defer oldReader.Close()
		_ = d.Put(versionPath, oldReader, oldSize)

		// 保存版本记录到数据库
		model.DB.Create(&model.FileVersion{
			FileID:   file.ID,
			Size:     oldSize,
			Path:     versionPath,
			PolicyID: file.PolicyID,
		})
	}

	// 4. 上传新内容
	newReader := strings.NewReader(content)
	newSize := int64(len(content))
	if err := d.Put(file.Path, newReader, newSize); err != nil {
		return err
	}

	// 更新搜索索引
	go func() {
		_ = utils.IndexFile(file.ID, userID, file.Name, content)
	}()

	// 5. 更新文件信息和用户空间
	return model.DB.Transaction(func(tx *gorm.DB) error {
		// 计算空间差异
		diff := newSize - file.Size

		if diff > 0 {
			var user model.User
			if err := tx.First(&user, userID).Error; err != nil {
				return err
			}
			if user.UsedSize+diff > user.TotalSize {
				return errors.New("存储空间不足")
			}
		}

		// 更新文件大小
		if err := tx.Model(&file).Update("size", newSize).Error; err != nil {
			return err
		}

		// 更新用户已用空间
		if err := tx.Model(&model.User{}).Where("id = ?", userID).UpdateColumn("used_size", gorm.Expr("used_size + ?", diff)).Error; err != nil {
			return err
		}

		return nil
	})
}

// ListFileVersions 获取文件版本列表
func ListFileVersions(userID uint, fileID uint) ([]model.FileVersion, error) {
	var file model.File
	if err := model.DB.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		return nil, errors.New("文件不存在")
	}

	var versions []model.FileVersion
	err := model.DB.Where("file_id = ?", fileID).Order("created_at desc").Find(&versions).Error
	return versions, err
}

// RestoreFileVersion 还原文件到指定版本
func RestoreFileVersion(userID uint, versionID uint) error {
	var version model.FileVersion
	if err := model.DB.First(&version, versionID).Error; err != nil {
		return errors.New("版本不存在")
	}

	var file model.File
	if err := model.DB.Where("id = ? AND user_id = ?", version.FileID, userID).First(&file).Error; err != nil {
		return errors.New("文件不存在")
	}

	// 1. 获取存储策略
	var policy model.StoragePolicy
	if err := model.DB.First(&policy, file.PolicyID).Error; err != nil {
		return err
	}

	// 2. 获取驱动
	d, err := driver.GetDriver(&policy)
	if err != nil {
		return err
	}

	// 3. 将版本内容写回原文件路径
	versionReader, err := d.Get(version.Path)
	if err != nil {
		return errors.New("无法读取版本文件")
	}
	defer versionReader.Close()

	if err := d.Put(file.Path, versionReader, version.Size); err != nil {
		return err
	}

	// 4. 更新数据库
	return model.DB.Transaction(func(tx *gorm.DB) error {
		diff := version.Size - file.Size
		if err := tx.Model(&file).Update("size", version.Size).Error; err != nil {
			return err
		}
		if err := tx.Model(&model.User{}).Where("id = ?", userID).UpdateColumn("used_size", gorm.Expr("used_size + ?", diff)).Error; err != nil {
			return err
		}
		return nil
	})
}

// ListFiles 获取文件列表
func ListFiles(userID uint, parentID uint) ([]model.File, error) {
	var files []model.File
	err := model.DB.Where("user_id = ? AND parent_id = ?", userID, parentID).Find(&files).Error
	return files, err
}

// BatchDownloadFiles 批量下载文件 (压缩成zip)
func BatchDownloadFiles(userID uint, fileIDs []uint, w io.Writer) error {
	zw := zip.NewWriter(w)
	defer zw.Close()

	for _, id := range fileIDs {
		var file model.File
		if err := model.DB.Where("id = ? AND user_id = ?", id, userID).First(&file).Error; err != nil {
			continue
		}

		if file.IsFolder {
			// 如果是文件夹，递归添加内容
			if err := addFolderToZip(zw, userID, file.ID, file.Name); err != nil {
				return err
			}
		} else {
			// 如果是文件，直接添加
			if err := addFileToZip(zw, &file); err != nil {
				return err
			}
		}
	}
	return nil
}

// GetFolderSize 递归计算文件夹大小
func GetFolderSize(userID uint, folderID uint) (int64, error) {
	var size int64
	var files []model.File
	if err := model.DB.Where("user_id = ? AND parent_id = ?", userID, folderID).Find(&files).Error; err != nil {
		return 0, err
	}

	for _, file := range files {
		if file.IsFolder {
			s, err := GetFolderSize(userID, file.ID)
			if err != nil {
				return 0, err
			}
			size += s
		} else {
			size += file.Size
		}
	}
	return size, nil
}

// SearchFiles 搜索文件
func SearchFiles(userID uint, keyword string) ([]model.File, error) {
	var files []model.File
	err := model.DB.Where("user_id = ? AND name LIKE ?", userID, "%"+keyword+"%").Find(&files).Error
	return files, err
}

func addFileToZip(zw *zip.Writer, file *model.File) error {
	var policy model.StoragePolicy
	if err := model.DB.First(&policy, file.PolicyID).Error; err != nil {
		return err
	}
	d, err := driver.GetDriver(&policy)
	if err != nil {
		return err
	}
	reader, err := d.Get(file.Path)
	if err != nil {
		return err
	}
	defer reader.Close()

	f, err := zw.Create(file.Name)
	if err != nil {
		return err
	}
	_, err = io.Copy(f, reader)
	return err
}

func addFolderToZip(zw *zip.Writer, userID uint, folderID uint, baseDir string) error {
	var files []model.File
	if err := model.DB.Where("user_id = ? AND parent_id = ?", userID, folderID).Find(&files).Error; err != nil {
		return err
	}

	for _, file := range files {
		relPath := filepath.Join(baseDir, file.Name)
		if file.IsFolder {
			if err := addFolderToZip(zw, userID, file.ID, relPath); err != nil {
				return err
			}
		} else {
			var policy model.StoragePolicy
			if err := model.DB.First(&policy, file.PolicyID).Error; err != nil {
				continue
			}
			d, err := driver.GetDriver(&policy)
			if err != nil {
				continue
			}
			reader, err := d.Get(file.Path)
			if err != nil {
				continue
			}
			f, err := zw.Create(relPath)
			if err != nil {
				reader.Close()
				continue
			}
			io.Copy(f, reader)
			reader.Close()
		}
	}
	return nil
}

// CreateFolder 创建文件夹
func CreateFolder(userID uint, parentID uint, name string) error {
	folder := model.File{
		Name:     name,
		IsFolder: true,
		ParentID: parentID,
		UserID:   userID,
	}
	return model.DB.Create(&folder).Error
}

// UploadFile 上传文件 (支持秒传)
func UploadFile(userID uint, parentID uint, name string, size int64, reader io.Reader, hash string) error {
	// 1. 获取用户信息，校验容量
	var user model.User
	if err := model.DB.First(&user, userID).Error; err != nil {
		return errors.New("用户不存在")
	}
	if user.UsedSize+size > user.TotalSize {
		return errors.New("存储空间不足")
	}

	// 2. 秒传检查 (如果提供了哈希)
	if hash != "" {
		var existingFile model.File
		if err := model.DB.Where("hash = ? AND deleted_at IS NULL", hash).First(&existingFile).Error; err == nil {
			// 发现相同哈希的文件，执行秒传
			return model.DB.Transaction(func(tx *gorm.DB) error {
				fileRecord := model.File{
					Name:     name,
					Size:     size,
					Hash:     hash,
					Path:     existingFile.Path,
					Ext:      filepath.Ext(name),
					IsFolder: false,
					ParentID: parentID,
					UserID:   userID,
					PolicyID: existingFile.PolicyID,
				}
				if err := tx.Create(&fileRecord).Error; err != nil {
					return err
				}

				// 更新用户已用空间
				if err := tx.Model(&user).Update("used_size", user.UsedSize+size).Error; err != nil {
					return err
				}

				return nil
			})
		}
	}

	// 3. 获取用户默认存储策略
	var policy model.StoragePolicy
	if err := model.DB.Where("is_default = ?", true).First(&policy).Error; err != nil {
		if err := model.DB.First(&policy).Error; err != nil {
			return errors.New("未配置存储策略")
		}
	}

	// 4. 获取驱动
	d, err := driver.GetDriver(&policy)
	if err != nil {
		return err
	}

	// 5. 构造存储路径 (使用时间戳或随机名避免冲突)
	ext := filepath.Ext(name)
	storageName := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	storagePath := filepath.Join("uploads", fmt.Sprintf("%d", userID), storageName)

	// 6. 调用驱动上传
	var contentBuffer bytes.Buffer
	var finalHash string

	// 如果前端没给哈希，我们在上传过程中计算一个
	if hash == "" {
		h := sha256.New()
		// 我们需要同时写入到 buffer (用于索引), hash (用于秒传), 和 driver.Put (通过 tee)
		// 但 Put 需要 reader。所以我们先读到 buffer。
		data, err := io.ReadAll(reader)
		if err != nil {
			return err
		}
		h.Write(data)
		finalHash = hex.EncodeToString(h.Sum(nil))
		contentBuffer.Write(data)

		if err := d.Put(storagePath, bytes.NewReader(data), size); err != nil {
			return err
		}
	} else {
		finalHash = hash
		teeReader := io.TeeReader(reader, &contentBuffer)
		if err := d.Put(storagePath, teeReader, size); err != nil {
			return err
		}
	}

	// 7. 事务更新数据库
	return model.DB.Transaction(func(tx *gorm.DB) error {
		fileRecord := model.File{
			Name:     name,
			Size:     size,
			Hash:     finalHash,
			Path:     storagePath,
			Ext:      ext,
			IsFolder: false,
			ParentID: parentID,
			UserID:   userID,
			PolicyID: policy.ID,
		}
		if err := tx.Create(&fileRecord).Error; err != nil {
			return err
		}

		// 更新用户已用空间
		if err := tx.Model(&user).Update("used_size", user.UsedSize+size).Error; err != nil {
			return err
		}

		// 异步建立搜索索引
		fileContent := ""
		if size < 1024*1024 {
			fileContent = contentBuffer.String()
		}
		go func() {
			_ = utils.IndexFile(fileRecord.ID, userID, name, fileContent)
		}()

		return nil
	})
}

// DeleteFile 删除文件/文件夹 (进入回收站)
func DeleteFile(userID uint, fileID uint) error {
	return model.DB.Where("id = ? AND user_id = ?", fileID, userID).Delete(&model.File{}).Error
}

// RenameFile 重命名文件/文件夹
func RenameFile(userID uint, fileID uint, newName string) error {
	return model.DB.Model(&model.File{}).Where("id = ? AND user_id = ?", fileID, userID).Update("name", newName).Error
}

// MoveFile 移动文件/文件夹
func MoveFile(userID uint, fileID uint, newParentID uint) error {
	// 防止将文件夹移动到自己及其子目录下 (简化版：只检查不能移动到自己)
	if fileID == newParentID {
		return errors.New("不能将文件夹移动到自身")
	}
	return model.DB.Model(&model.File{}).Where("id = ? AND user_id = ?", fileID, userID).Update("parent_id", newParentID).Error
}

// ListRecycleBin 获取回收站文件列表
func ListRecycleBin(userID uint) ([]model.File, error) {
	var files []model.File
	// Unscoped() 可以查询到被软删除的数据
	err := model.DB.Unscoped().Where("user_id = ? AND deleted_at IS NOT NULL", userID).Find(&files).Error
	return files, err
}

// CopyFile 递归复制文件或文件夹记录到新用户下
func CopyFile(srcFile *model.File, targetUserID uint, targetParentID uint) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 校验容量
		var user model.User
		if err := tx.First(&user, targetUserID).Error; err != nil {
			return err
		}

		// 如果是文件夹，我们需要先计算总大小
		var totalSize int64
		if srcFile.IsFolder {
			size, err := GetFolderSize(srcFile.UserID, srcFile.ID)
			if err != nil {
				return err
			}
			totalSize = size
		} else {
			totalSize = srcFile.Size
		}

		if user.UsedSize+totalSize > user.TotalSize {
			return errors.New("存储空间不足")
		}

		// 2. 执行复制
		return copyRecursive(tx, srcFile, targetUserID, targetParentID)
	})
}

func copyRecursive(tx *gorm.DB, srcFile *model.File, targetUserID uint, targetParentID uint) error {
	newFile := model.File{
		Name:     srcFile.Name,
		Size:     srcFile.Size,
		Hash:     srcFile.Hash,
		Path:     srcFile.Path,
		Ext:      srcFile.Ext,
		IsFolder: srcFile.IsFolder,
		ParentID: targetParentID,
		UserID:   targetUserID,
		PolicyID: srcFile.PolicyID,
	}

	if err := tx.Create(&newFile).Error; err != nil {
		return err
	}

	// 更新用户空间
	if !srcFile.IsFolder {
		if err := tx.Model(&model.User{}).Where("id = ?", targetUserID).UpdateColumn("used_size", gorm.Expr("used_size + ?", srcFile.Size)).Error; err != nil {
			return err
		}
	}

	if srcFile.IsFolder {
		var children []model.File
		if err := tx.Where("parent_id = ? AND user_id = ?", srcFile.ID, srcFile.UserID).Find(&children).Error; err != nil {
			return err
		}
		for _, child := range children {
			if err := copyRecursive(tx, &child, targetUserID, newFile.ID); err != nil {
				return err
			}
		}
	}

	return nil
}

// CleanRecycleBin 清理回收站 (days: 清理多少天前的)
func CleanRecycleBin(days int) (int64, error) {
	cutoff := time.Now().AddDate(0, 0, -days)
	var files []model.File
	// 查找所有在 cutoff 之前删除的文件 (逻辑删除的文件 deleted_at 不为空)
	// 注意: GORM 默认查询会过滤 deleted_at IS NULL, 所以要用 Unscoped
	if err := model.DB.Unscoped().Where("deleted_at < ?", cutoff).Find(&files).Error; err != nil {
		return 0, err
	}

	var count int64
	for _, file := range files {
		// 1. 获取存储策略和驱动
		var policy model.StoragePolicy
		if err := model.DB.First(&policy, file.PolicyID).Error; err != nil {
			continue
		}
		d, err := driver.GetDriver(&policy)
		if err != nil {
			continue
		}

		// 2. 只有当没有其他文件引用此路径时，才物理删除 (防止秒传引用的文件被误删)
		var otherRefs int64
		model.DB.Model(&model.File{}).Where("path = ? AND id != ?", file.Path, file.ID).Count(&otherRefs)

		if otherRefs == 0 && file.Path != "" {
			_ = d.Delete(file.Path)
		}

		// 3. 彻底从数据库删除
		if err := model.DB.Unscoped().Delete(&file).Error; err == nil {
			count++
		}
	}

	return count, nil
}

// RestoreFile 还原文件
func RestoreFile(userID uint, fileID uint) error {
	return model.DB.Unscoped().Model(&model.File{}).Where("id = ? AND user_id = ?", fileID, userID).Update("deleted_at", nil).Error
}

// PermanentDeleteFile 彻底删除文件
func PermanentDeleteFile(userID uint, fileID uint) error {
	var file model.File
	if err := model.DB.Unscoped().Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		return errors.New("文件不存在")
	}

	return model.DB.Transaction(func(tx *gorm.DB) error {
		if !file.IsFolder {
			// 1. 获取存储策略
			var policy model.StoragePolicy
			if err := tx.First(&policy, file.PolicyID).Error; err != nil {
				return err
			}

			// 2. 获取驱动
			d, err := driver.GetDriver(&policy)
			if err != nil {
				return err
			}

			// 3. 删除物理文件
			_ = d.Delete(file.Path)

			// 4. 更新用户已用空间
			if err := tx.Model(&model.User{}).Where("id = ?", userID).UpdateColumn("used_size", gorm.Expr("used_size - ?", file.Size)).Error; err != nil {
				return err
			}
		}

		// 5. 彻底删除数据库记录
		return tx.Unscoped().Delete(&file).Error
	})
}
