package driver

import (
	"io"
	"os"
	"path/filepath"
)

// LocalDriver 本地存储驱动
type LocalDriver struct {
	Root string
}

func NewLocalDriver(root string) *LocalDriver {
	// 确保根目录存在
	if _, err := os.Stat(root); os.IsNotExist(err) {
		os.MkdirAll(root, 0755)
	}
	return &LocalDriver{Root: root}
}

func (d *LocalDriver) Put(path string, reader io.Reader, size int64) error {
	fullPath := filepath.Join(d.Root, path)
	// 确保父目录存在
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return err
	}

	file, err := os.Create(fullPath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, reader)
	return err
}

func (d *LocalDriver) Get(path string) (io.ReadCloser, error) {
	fullPath := filepath.Join(d.Root, path)
	return os.Open(fullPath)
}

func (d *LocalDriver) Delete(path string) error {
	fullPath := filepath.Join(d.Root, path)
	return os.Remove(fullPath)
}

func (d *LocalDriver) Exists(path string) (bool, error) {
	fullPath := filepath.Join(d.Root, path)
	_, err := os.Stat(fullPath)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func (d *LocalDriver) GetURL(path string) (string, error) {
	// 本地存储返回相对路径或后端代理路径
	return "/api/v1/file/download?path=" + path, nil
}
