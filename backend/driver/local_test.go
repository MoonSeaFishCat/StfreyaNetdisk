package driver

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLocalDriver(t *testing.T) {
	// 创建临时测试目录
	tempDir, err := os.MkdirTemp("", "stfreya_test_*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempDir)

	d := NewLocalDriver(tempDir)

	t.Run("Put and Get", func(t *testing.T) {
		content := []byte("hello stfreya")
		filename := "test.txt"
		
		// 测试 Put
		err := d.Put(filename, bytes.NewReader(content), int64(len(content)))
		assert.NoError(t, err)

		// 测试 Exists
		exists, err := d.Exists(filename)
		assert.NoError(t, err)
		assert.True(t, exists)

		// 测试 Get
		reader, err := d.Get(filename)
		assert.NoError(t, err)
		defer reader.Close()
		
		gotContent, err := io.ReadAll(reader)
		assert.NoError(t, err)
		assert.Equal(t, content, gotContent)
	})

	t.Run("Delete", func(t *testing.T) {
		filename := "delete_me.txt"
		d.Put(filename, bytes.NewReader([]byte("bye")), 3)
		
		err := d.Delete(filename)
		assert.NoError(t, err)

		exists, _ := d.Exists(filename)
		assert.False(t, exists)
	})

	t.Run("Nested Directories", func(t *testing.T) {
		path := "a/b/c/file.txt"
		content := []byte("nested")
		
		err := d.Put(path, bytes.NewReader(content), int64(len(content)))
		assert.NoError(t, err)

		exists, _ := d.Exists(path)
		assert.True(t, exists)
		
		// 验证物理路径是否存在
		_, err = os.Stat(filepath.Join(tempDir, "a", "b", "c", "file.txt"))
		assert.NoError(t, err)
	})
}
