package service

import (
	"github.com/stfreya/stfreyanetdisk/model"
)

// SendMessage 发送系统消息
func SendMessage(userID uint, title, content, msgType string) error {
	msg := model.Message{
		UserID:  userID,
		Title:   title,
		Content: content,
		Type:    msgType,
	}
	return model.DB.Create(&msg).Error
}

// ListMessages 获取用户消息列表
func ListMessages(userID uint) ([]model.Message, error) {
	var messages []model.Message
	err := model.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&messages).Error
	return messages, err
}

// MarkMessageRead 标记消息为已读
func MarkMessageRead(userID uint, messageID uint) error {
	return model.DB.Model(&model.Message{}).Where("id = ? AND user_id = ?", messageID, userID).Update("is_read", true).Error
}

// MarkAllMessagesRead 标记所有消息为已读
func MarkAllMessagesRead(userID uint) error {
	return model.DB.Model(&model.Message{}).Where("user_id = ?", userID).Update("is_read", true).Error
}

// DeleteMessage 删除消息
func DeleteMessage(userID uint, messageID uint) error {
	return model.DB.Where("id = ? AND user_id = ?", messageID, userID).Delete(&model.Message{}).Error
}

// GetUnreadMessageCount 获取未读消息数量
func GetUnreadMessageCount(userID uint) (int64, error) {
	var count int64
	err := model.DB.Model(&model.Message{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&count).Error
	return count, err
}
