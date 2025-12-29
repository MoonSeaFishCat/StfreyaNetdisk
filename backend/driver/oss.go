package driver

import (
	"io"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

type OSSDriver struct {
	client     *oss.Client
	bucket     *oss.Bucket
	endpoint   string
	bucketName string
}

func NewOSSDriver(endpoint, accessKey, secretKey, bucketName string) (*OSSDriver, error) {
	client, err := oss.New(endpoint, accessKey, secretKey)
	if err != nil {
		return nil, err
	}
	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return nil, err
	}
	return &OSSDriver{
		client:     client,
		bucket:     bucket,
		endpoint:   endpoint,
		bucketName: bucketName,
	}, nil
}

func (d *OSSDriver) Put(path string, reader io.Reader, size int64) error {
	return d.bucket.PutObject(path, reader, oss.ContentLength(size))
}

func (d *OSSDriver) Get(path string) (io.ReadCloser, error) {
	return d.bucket.GetObject(path)
}

func (d *OSSDriver) Delete(path string) error {
	return d.bucket.DeleteObject(path)
}

func (d *OSSDriver) Exists(path string) (bool, error) {
	return d.bucket.IsObjectExist(path)
}

func (d *OSSDriver) GetURL(path string) (string, error) {
	// 获取签名 URL，有效期 1 小时
	return d.bucket.SignURL(path, oss.HTTPGet, 3600)
}
