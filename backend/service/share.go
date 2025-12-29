package service

import (
	"errors"
	"time"

	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/utils"
)

// CreateShare 创建分享
func CreateShare(userID uint, fileID uint, password string, expireDays int) (string, error) {
	// 检查文件是否存在且属于该用户
	var file model.File
	if err := model.DB.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error; err != nil {
		return "", errors.New("文件不存在或无权分享")
	}

	token := utils.RandomString(32)
	var expireTime *time.Time
	if expireDays > 0 {
		t := time.Now().AddDate(0, 0, expireDays)
		expireTime = &t
	}

	share := model.Share{
		FileID:     fileID,
		UserID:     userID,
		Password:   password,
		ExpireTime: expireTime,
		Token:      token,
	}

	if err := model.DB.Create(&share).Error; err != nil {
		return "", err
	}

	return token, nil
}

// GetShare 获取分享信息
func GetShare(token string) (*model.Share, *model.File, error) {
	var share model.Share
	if err := model.DB.Where("token = ?", token).First(&share).Error; err != nil {
		return nil, nil, errors.New("分享不存在")
	}

	// 检查是否过期
	if share.ExpireTime != nil && share.ExpireTime.Before(time.Now()) {
		return nil, nil, errors.New("分享已过期")
	}

	var file model.File
	if err := model.DB.First(&file, share.FileID).Error; err != nil {
		return nil, nil, errors.New("文件已丢失")
	}

	// 增加访问次数
	model.DB.Model(&share).Update("views", share.Views+1)

	return &share, &file, nil
}
