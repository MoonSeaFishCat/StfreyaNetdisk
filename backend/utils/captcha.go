package utils

import (
	"github.com/mojocn/base64Captcha"
)

// 使用内存存储验证码，实际生产环境建议使用 Redis
var store = base64Captcha.DefaultMemStore

// GenerateCaptcha 生成图形验证码
func GenerateCaptcha() (id string, b64s string, err error) {
	// 萌系风格验证码配置：使用圆点干扰，较柔和的颜色
	driver := base64Captcha.NewDriverDigit(80, 240, 5, 0.7, 80)
	cp := base64Captcha.NewCaptcha(driver, store)
	id, b64s, _, err = cp.Generate()
	return id, b64s, err
}

// VerifyCaptcha 校验验证码
func VerifyCaptcha(id string, answer string) bool {
	return store.Verify(id, answer, true)
}
