package driver

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

type OneDriveDriver struct {
	ClientID     string
	ClientSecret string
	RefreshToken string
	AccessToken  string
	RootPath     string
}

func NewOneDriveDriver(clientID, clientSecret, refreshToken, rootPath string) (*OneDriveDriver, error) {
	d := &OneDriveDriver{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RefreshToken: refreshToken,
		RootPath:     rootPath,
	}
	// 初始化时刷新一次 token
	if err := d.refreshAccessToken(); err != nil {
		return nil, err
	}
	return d, nil
}

func (d *OneDriveDriver) refreshAccessToken() error {
	// 实际生产中应有缓存机制，这里简单实现
	url := "https://login.microsoftonline.com/common/oauth2/v2.0/token"
	data := fmt.Sprintf("client_id=%s&client_secret=%s&refresh_token=%s&grant_type=refresh_token",
		d.ClientID, d.ClientSecret, d.RefreshToken)

	req, err := http.NewRequest("POST", url, bytes.NewBufferString(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var res struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return err
	}

	if res.AccessToken == "" {
		return errors.New("refresh token failed")
	}

	d.AccessToken = res.AccessToken
	return nil
}

func (d *OneDriveDriver) Put(path string, reader io.Reader, size int64) error {
	// 如果文件小于 4MB，直接上传
	if size < 4*1024*1024 {
		return d.simpleUpload(path, reader, size)
	}
	// 否则使用分片上传
	return d.chunkedUpload(path, reader, size)
}

func (d *OneDriveDriver) simpleUpload(path string, reader io.Reader, _ int64) error {
	url := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/drive/root:/%s/%s:/content", d.RootPath, path)
	return d.doRequestWithRetry("PUT", url, reader, "application/octet-stream")
}

func (d *OneDriveDriver) chunkedUpload(path string, reader io.Reader, size int64) error {
	// 1. 创建上传会话
	sessionURL := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/drive/root:/%s/%s:/createUploadSession", d.RootPath, path)
	resp, err := d.doRawRequest("POST", sessionURL, nil, "application/json")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var session struct {
		UploadURL string `json:"uploadUrl"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&session); err != nil {
		return err
	}

	// 2. 分片上传 (每片 320KB 的倍数，这里选 5MB)
	chunkSize := int64(5 * 1024 * 1024)
	buffer := make([]byte, chunkSize)
	for start := int64(0); start < size; {
		n, err := io.ReadFull(reader, buffer)
		if err != nil && err != io.EOF && err != io.ErrUnexpectedEOF {
			return err
		}
		if n == 0 {
			break
		}

		end := start + int64(n) - 1
		req, _ := http.NewRequest("PUT", session.UploadURL, bytes.NewReader(buffer[:n]))
		req.Header.Set("Content-Length", fmt.Sprintf("%d", n))
		req.Header.Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, size))

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return err
		}
		resp.Body.Close()

		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusCreated {
			return fmt.Errorf("chunked upload failed: %s", resp.Status)
		}
		start = end + 1
	}

	return nil
}

func (d *OneDriveDriver) doRequestWithRetry(method, url string, body io.Reader, contentType string) error {
	resp, err := d.doRawRequest(method, url, body, contentType)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		if err = d.refreshAccessToken(); err != nil {
			return err
		}
		// 重试一次
		resp, err = d.doRawRequest(method, url, body, contentType)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("onedrive request failed: %s", resp.Status)
	}
	return nil
}

func (d *OneDriveDriver) doRawRequest(method, url string, body io.Reader, contentType string) (*http.Response, error) {
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+d.AccessToken)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	return http.DefaultClient.Do(req)
}

func (d *OneDriveDriver) Get(path string) (io.ReadCloser, error) {
	url := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/drive/root:/%s/%s:/content", d.RootPath, path)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+d.AccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("onedrive get failed: %s", resp.Status)
	}

	return resp.Body, nil
}

func (d *OneDriveDriver) Delete(path string) error {
	url := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/drive/root:/%s/%s", d.RootPath, path)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+d.AccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("onedrive delete failed: %s", resp.Status)
	}

	return nil
}

func (d *OneDriveDriver) Exists(path string) (bool, error) {
	url := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/drive/root:/%s/%s", d.RootPath, path)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+d.AccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return true, nil
	}
	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}
	return false, fmt.Errorf("onedrive exists check failed: %s", resp.Status)
}

func (d *OneDriveDriver) GetURL(path string) (string, error) {
	// 获取临时下载链接
	url := fmt.Sprintf("https://graph.microsoft.com/v1.0/me/drive/root:/%s/%s", d.RootPath, path)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+d.AccessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("onedrive get url failed: %s", resp.Status)
	}

	var result struct {
		DownloadURL string `json:"@microsoft.graph.downloadUrl"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.DownloadURL, nil
}
