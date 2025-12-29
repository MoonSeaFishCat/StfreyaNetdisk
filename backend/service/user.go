package service

import (
	"errors"
	"strconv"

	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username       string `json:"username" binding:"required"`
	Password       string `json:"password" binding:"required,min=6"`
	Email          string `json:"email" binding:"required,email"`
	InvitationCode string `json:"invitationCode" binding:"required"`
	CaptchaId      string `json:"captchaId" binding:"required"`
	CaptchaValue   string `json:"captchaValue" binding:"required"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username     string `json:"username" binding:"required"`
	Password     string `json:"password" binding:"required"`
	CaptchaId    string `json:"captchaId" binding:"required"`
	CaptchaValue string `json:"captchaValue" binding:"required"`
}

// Register 用户注册
func Register(req RegisterRequest) error {
	// 0. 检查是否允许注册
	if model.GetConfig("allow_register", "true") != "true" {
		return errors.New("当前站点已关闭注册")
	}

	// 0.1 校验验证码
	if !utils.VerifyCaptcha(req.CaptchaId, req.CaptchaValue) {
		return errors.New("验证码错误")
	}

	// 1. 校验邀请码
	var invite model.InvitationCode
	if err := model.DB.Where("code = ? AND status = 0", req.InvitationCode).First(&invite).Error; err != nil {
		return errors.New("无效或已使用的邀请码")
	}

	// 2. 检查用户名是否已存在
	var count int64
	model.DB.Model(&model.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		return errors.New("用户名已存在")
	}

	// 3. 密码加密
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 从配置获取默认配额
	quotaStr := model.GetConfig("default_quota", "10737418240")
	quota, _ := strconv.ParseInt(quotaStr, 10, 64)

	// 4. 创建用户
	user := model.User{
		Username:  req.Username,
		Password:  string(hashedPassword),
		Email:     req.Email,
		Coin:      50,    // 初始赠送 50 学园币
		TotalSize: quota, // 使用默认配额
	}

	return model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		// 标记邀请码已使用
		invite.Status = 1
		invite.UsedByID = user.ID
		if err := tx.Save(&invite).Error; err != nil {
			return err
		}
		return nil
	})
}

// Login 用户登录
func Login(req LoginRequest) (string, *model.User, error) {
	// 0. 校验验证码
	if !utils.VerifyCaptcha(req.CaptchaId, req.CaptchaValue) {
		return "", nil, errors.New("验证码错误")
	}

	var user model.User
	if err := model.DB.Where("username = ? OR email = ?", req.Username, req.Username).First(&user).Error; err != nil {
		return "", nil, errors.New("用户不存在")
	}

	// 校验密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return "", nil, errors.New("密码错误")
	}

	// 生成 Token
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		return "", nil, err
	}

	return token, &user, nil
}
