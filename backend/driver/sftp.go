package driver

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type SFTPDriver struct {
	Host     string
	Port     int
	User     string
	Password string
	Root     string
}

func NewSFTPDriver(host string, port int, user, password, root string) (*SFTPDriver, error) {
	return &SFTPDriver{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		Root:     root,
	}, nil
}

func (d *SFTPDriver) getClient() (*ssh.Client, *sftp.Client, error) {
	config := &ssh.ClientConfig{
		User: d.User,
		Auth: []ssh.AuthMethod{
			ssh.Password(d.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         5 * time.Second,
	}

	addr := fmt.Sprintf("%s:%d", d.Host, d.Port)
	sshClient, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return nil, nil, err
	}

	sftpClient, err := sftp.NewClient(sshClient)
	if err != nil {
		sshClient.Close()
		return nil, nil, err
	}

	return sshClient, sftpClient, nil
}

func (d *SFTPDriver) Put(path string, reader io.Reader, size int64) error {
	sshClient, sftpClient, err := d.getClient()
	if err != nil {
		return err
	}
	defer sshClient.Close()
	defer sftpClient.Close()

	fullPath := filepath.Join(d.Root, path)
	// 确保父目录存在
	dir := filepath.Dir(fullPath)
	if err = sftpClient.MkdirAll(dir); err != nil {
		return err
	}

	f, err := sftpClient.Create(fullPath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = io.Copy(f, reader)
	return err
}

func (d *SFTPDriver) Get(path string) (io.ReadCloser, error) {
	sshClient, sftpClient, err := d.getClient()
	if err != nil {
		return nil, err
	}

	fullPath := filepath.Join(d.Root, path)
	f, err := sftpClient.Open(fullPath)
	if err != nil {
		sshClient.Close()
		sftpClient.Close()
		return nil, err
	}

	// 我们需要包装一下，确保关闭文件时也能关闭 ssh 连接
	return &sftpReadCloser{
		File:       f,
		sftpClient: sftpClient,
		sshClient:  sshClient,
	}, nil
}

type sftpReadCloser struct {
	*sftp.File
	sftpClient *sftp.Client
	sshClient  *ssh.Client
}

func (rc *sftpReadCloser) Close() error {
	err1 := rc.File.Close()
	err2 := rc.sftpClient.Close()
	err3 := rc.sshClient.Close()
	if err1 != nil {
		return err1
	}
	if err2 != nil {
		return err2
	}
	return err3
}

func (d *SFTPDriver) Delete(path string) error {
	sshClient, sftpClient, err := d.getClient()
	if err != nil {
		return err
	}
	defer sshClient.Close()
	defer sftpClient.Close()

	fullPath := filepath.Join(d.Root, path)
	return sftpClient.Remove(fullPath)
}

func (d *SFTPDriver) Exists(path string) (bool, error) {
	sshClient, sftpClient, err := d.getClient()
	if err != nil {
		return false, err
	}
	defer sshClient.Close()
	defer sftpClient.Close()

	fullPath := filepath.Join(d.Root, path)
	_, err = sftpClient.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (d *SFTPDriver) GetURL(path string) (string, error) {
	// SFTP 通常不支持直接的 HTTP 访问链接，需要通过后端代理下载
	return "", nil
}
