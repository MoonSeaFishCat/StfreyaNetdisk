package driver

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/tencentyun/cos-go-sdk-v5"
)

type COSDriver struct {
	client    *cos.Client
	baseURL   string
	secretID  string
	secretKey string
}

func NewCOSDriver(bucketURL, secretID, secretKey string) (*COSDriver, error) {
	u, _ := url.Parse(bucketURL)
	b := &cos.BaseURL{BucketURL: u}
	client := cos.NewClient(b, &http.Client{
		Transport: &cos.AuthorizationTransport{
			SecretID:  secretID,
			SecretKey: secretKey,
		},
	})
	return &COSDriver{
		client:    client,
		baseURL:   bucketURL,
		secretID:  secretID,
		secretKey: secretKey,
	}, nil
}

func (d *COSDriver) Put(path string, reader io.Reader, size int64) error {
	opt := &cos.ObjectPutOptions{
		ObjectPutHeaderOptions: &cos.ObjectPutHeaderOptions{
			ContentLength: size,
		},
	}
	_, err := d.client.Object.Put(context.Background(), path, reader, opt)
	return err
}

func (d *COSDriver) Get(path string) (io.ReadCloser, error) {
	resp, err := d.client.Object.Get(context.Background(), path, nil)
	if err != nil {
		return nil, err
	}
	return resp.Body, nil
}

func (d *COSDriver) Delete(path string) error {
	_, err := d.client.Object.Delete(context.Background(), path)
	return err
}

func (d *COSDriver) Exists(path string) (bool, error) {
	return d.client.Object.IsExist(context.Background(), path)
}

func (d *COSDriver) GetURL(path string) (string, error) {
	presignedURL, err := d.client.Object.GetPresignedURL(context.Background(), http.MethodGet, path, d.secretID, d.secretKey, time.Hour, nil)
	if err != nil {
		return "", err
	}
	return presignedURL.String(), nil
}
