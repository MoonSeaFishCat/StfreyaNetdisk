package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/stfreya/stfreyanetdisk/service"
)

// ListMessages 获取用户消息列表
func ListMessages(c *gin.Context) {
	userID := c.GetUint("userID")
	messages, err := service.ListMessages(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取消息列表失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": messages})
}

// MarkMessageRead 标记消息为已读
func MarkMessageRead(c *gin.Context) {
	userID := c.GetUint("userID")
	messageIDStr := c.Param("id")
	messageID, _ := strconv.ParseUint(messageIDStr, 10, 32)

	if err := service.MarkMessageRead(userID, uint(messageID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "已读"})
}

// MarkAllMessagesRead 标记所有消息为已读
func MarkAllMessagesRead(c *gin.Context) {
	userID := c.GetUint("userID")
	if err := service.MarkAllMessagesRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "全部已读"})
}

// DeleteMessage 删除消息
func DeleteMessage(c *gin.Context) {
	userID := c.GetUint("userID")
	messageIDStr := c.Param("id")
	messageID, _ := strconv.ParseUint(messageIDStr, 10, 32)

	if err := service.DeleteMessage(userID, uint(messageID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "操作失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// GetUnreadCount 获取未读消息数量
func GetUnreadCount(c *gin.Context) {
	userID := c.GetUint("userID")
	count, err := service.GetUnreadMessageCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"count": count})
}
