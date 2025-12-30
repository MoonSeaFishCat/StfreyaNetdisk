package service

import (
	"errors"
	"time"

	"strconv"

	"github.com/stfreya/stfreyanetdisk/model"
	"github.com/stfreya/stfreyanetdisk/utils"
	"gorm.io/gorm"
)

// SignIn 用户签到
func SignIn(userID uint) (int, error) {
	var user model.User
	if err := model.DB.First(&user, userID).Error; err != nil {
		return 0, err
	}

	now := time.Now()
	// 检查今天是否已经签到
	if user.LastSignInAt != nil {
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		if user.LastSignInAt.After(today) {
			return 0, errors.New("今天已经签到过了哦")
		}
	}

	// 从配置获取签到奖励
	rewardStr := model.GetConfig("signin_reward", "5")
	reward, _ := strconv.Atoi(rewardStr)

	err := model.DB.Transaction(func(tx *gorm.DB) error {
		// 更新用户余额和签到时间
		if err := tx.Model(&user).Updates(map[string]interface{}{
			"coin":            user.Coin + reward,
			"last_sign_in_at": &now,
		}).Error; err != nil {
			return err
		}

		// 记录流水
		transaction := model.UserTransaction{
			UserID: userID,
			Amount: reward,
			Type:   "signin",
			Remark: "每日签到奖励",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return nil
	})

	if err == nil {
		_ = SendMessage(userID, "签到成功", "恭喜！每日签到成功，获得 "+strconv.Itoa(reward)+" 个学园币。", "success")
	}

	return reward, err
}

// GenerateInvitationCode 生成邀请码
func GenerateInvitationCode(userID uint) (string, error) {
	var user model.User
	if err := model.DB.First(&user, userID).Error; err != nil {
		return "", err
	}

	// 从配置获取邀请码成本
	costStr := model.GetConfig("invite_cost", "10")
	cost, _ := strconv.Atoi(costStr)

	if user.Coin < cost {
		return "", errors.New("学园币不足，无法生成邀请码")
	}

	code := utils.RandomString(16)

	err := model.DB.Transaction(func(tx *gorm.DB) error {
		// 扣除学园币
		if err := tx.Model(&user).Update("coin", user.Coin-cost).Error; err != nil {
			return err
		}

		// 创建邀请码
		invite := model.InvitationCode{
			Code:      code,
			CreatorID: userID,
			Status:    0,
		}
		if err := tx.Create(&invite).Error; err != nil {
			return err
		}

		// 记录流水
		transaction := model.UserTransaction{
			UserID: userID,
			Amount: -cost,
			Type:   "invite",
			Remark: "生成邀请码消耗",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return nil
	})

	return code, err
}

// BatchGenerateInvitationCodes 批量生成邀请码 (通常供管理员使用，不扣费)
func BatchGenerateInvitationCodes(count int, creatorID uint) ([]string, error) {
	if count <= 0 || count > 100 {
		return nil, errors.New("数量不合法 (1-100)")
	}

	var codes []string
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		for i := 0; i < count; i++ {
			code := utils.RandomString(16)
			invite := model.InvitationCode{
				Code:      code,
				CreatorID: creatorID,
				Status:    0,
			}
			if err := tx.Create(&invite).Error; err != nil {
				return err
			}
			codes = append(codes, code)
		}
		return nil
	})

	return codes, err
}

// AddCoin 增加用户学园币
func AddCoin(userID uint, amount int, transType string, remark string) error {
	if amount <= 0 {
		return nil
	}

	return model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.User{}).Where("id = ?", userID).UpdateColumn("coin", gorm.Expr("coin + ?", amount)).Error; err != nil {
			return err
		}

		transaction := model.UserTransaction{
			UserID: userID,
			Amount: amount,
			Type:   transType,
			Remark: remark,
		}
		return tx.Create(&transaction).Error
	})
}

// GetUserTransactions 获取用户学园币流水
func GetUserTransactions(userID uint) ([]model.UserTransaction, error) {
	var transactions []model.UserTransaction
	err := model.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&transactions).Error
	return transactions, err
}

// ExchangeQuota 兑换存储空间
func ExchangeQuota(userID uint, gb int) error {
	if gb <= 0 {
		return errors.New("兑换容量必须大于 0")
	}

	var user model.User
	if err := model.DB.First(&user, userID).Error; err != nil {
		return err
	}

	// 1GB = 10 学园币 (暂定)
	costPerGBStr := model.GetConfig("quota_exchange_cost", "10")
	costPerGB, _ := strconv.Atoi(costPerGBStr)
	totalCost := gb * costPerGB

	if user.Coin < totalCost {
		return errors.New("学园币不足")
	}

	err := model.DB.Transaction(func(tx *gorm.DB) error {
		// 扣除学园币并增加容量
		// 1GB = 1024 * 1024 * 1024 Bytes
		increment := int64(gb) * 1024 * 1024 * 1024
		if err := tx.Model(&user).Updates(map[string]interface{}{
			"coin":       user.Coin - totalCost,
			"total_size": user.TotalSize + increment,
		}).Error; err != nil {
			return err
		}

		// 记录流水
		transaction := model.UserTransaction{
			UserID: userID,
			Amount: -totalCost,
			Type:   "consume",
			Remark: "兑换存储空间: " + strconv.Itoa(gb) + "GB",
		}
		return tx.Create(&transaction).Error
	})

	if err == nil {
		_ = SendMessage(userID, "兑换成功", "成功兑换 "+strconv.Itoa(gb)+"GB 存储空间，消耗了 "+strconv.Itoa(totalCost)+" 个学园币。", "success")
	}

	return err
}
