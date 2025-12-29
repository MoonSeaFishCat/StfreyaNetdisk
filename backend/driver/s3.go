package driver

import (
	"context"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Driver struct {
	Client        *s3.Client
	PresignClient *s3.PresignClient
	Bucket        string
	Region        string
}

func NewS3Driver(endpoint, accessKey, secretKey, bucket, region string) (*S3Driver, error) {
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               endpoint,
			SigningRegion:     region,
			HostnameImmutable: true,
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
		config.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg)
	presignClient := s3.NewPresignClient(client)
	return &S3Driver{
		Client:        client,
		PresignClient: presignClient,
		Bucket:        bucket,
		Region:        region,
	}, nil
}

func (d *S3Driver) Put(path string, reader io.Reader, size int64) error {
	_, err := d.Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:        aws.String(d.Bucket),
		Key:           aws.String(path),
		Body:          reader,
		ContentLength: aws.Int64(size),
	})
	return err
}

func (d *S3Driver) Get(path string) (io.ReadCloser, error) {
	output, err := d.Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(d.Bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		return nil, err
	}
	return output.Body, nil
}

func (d *S3Driver) Delete(path string) error {
	_, err := d.Client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(d.Bucket),
		Key:    aws.String(path),
	})
	return err
}

func (d *S3Driver) Exists(path string) (bool, error) {
	_, err := d.Client.HeadObject(context.TODO(), &s3.HeadObjectInput{
		Bucket: aws.String(d.Bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (d *S3Driver) GetURL(path string) (string, error) {
	request, err := d.PresignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(d.Bucket),
		Key:    aws.String(path),
	}, s3.WithPresignExpires(time.Hour))
	if err != nil {
		return "", err
	}
	return request.URL, nil
}
