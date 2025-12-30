package driver

import (
	"encoding/json"
	"errors"
	"io"

	"github.com/stfreya/stfreyanetdisk/model"
)

type Driver interface {
	Put(path string, reader io.Reader, size int64) error
	Get(path string) (io.ReadCloser, error)
	Delete(path string) error
	Exists(path string) (bool, error)
	GetURL(path string) (string, error)
}

func GetDriver(policy *model.StoragePolicy) (Driver, error) {
	switch policy.Type {
	case "local":
		var cfg struct {
			Root string `json:"root"`
		}
		if err := json.Unmarshal([]byte(policy.Config), &cfg); err != nil {
			return nil, errors.New("存储策略配置错误")
		}
		return NewLocalDriver(cfg.Root), nil
	case "s3":
		var cfg struct {
			Endpoint  string `json:"endpoint"`
			AccessKey string `json:"accessKey"`
			SecretKey string `json:"secretKey"`
			Bucket    string `json:"bucket"`
			Region    string `json:"region"`
		}
		if err := json.Unmarshal([]byte(policy.Config), &cfg); err != nil {
			return nil, errors.New("存储策略配置错误")
		}
		return NewS3Driver(cfg.Endpoint, cfg.AccessKey, cfg.SecretKey, cfg.Bucket, cfg.Region)
	case "oss":
		var cfg struct {
			Endpoint  string `json:"endpoint"`
			AccessKey string `json:"accessKey"`
			SecretKey string `json:"secretKey"`
			Bucket    string `json:"bucket"`
		}
		if err := json.Unmarshal([]byte(policy.Config), &cfg); err != nil {
			return nil, errors.New("存储策略配置错误")
		}
		return NewOSSDriver(cfg.Endpoint, cfg.AccessKey, cfg.SecretKey, cfg.Bucket)
	case "cos":
		var cfg struct {
			BucketURL string `json:"bucketUrl"`
			SecretID  string `json:"secretId"`
			SecretKey string `json:"secretKey"`
		}
		if err := json.Unmarshal([]byte(policy.Config), &cfg); err != nil {
			return nil, errors.New("存储策略配置错误")
		}
		return NewCOSDriver(cfg.BucketURL, cfg.SecretID, cfg.SecretKey)
	case "sftp":
		var cfg struct {
			Host     string `json:"host"`
			Port     int    `json:"port"`
			User     string `json:"user"`
			Password string `json:"password"`
			Root     string `json:"root"`
		}
		if err := json.Unmarshal([]byte(policy.Config), &cfg); err != nil {
			return nil, errors.New("存储策略配置错误")
		}
		return NewSFTPDriver(cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Root)
	case "onedrive":
		var cfg struct {
			ClientID     string `json:"client_id"`
			ClientSecret string `json:"client_secret"`
			RefreshToken string `json:"refresh_token"`
			RootPath     string `json:"root_path"`
		}
		if err := json.Unmarshal([]byte(policy.Config), &cfg); err != nil {
			return nil, errors.New("存储策略配置错误")
		}
		return NewOneDriveDriver(cfg.ClientID, cfg.ClientSecret, cfg.RefreshToken, cfg.RootPath)
	default:
		return nil, errors.New("不支持的存储类型")
	}
}
