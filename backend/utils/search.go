package utils

import (
	"fmt"
	"os"
	"sync"

	"github.com/blevesearch/bleve/v2"
	"github.com/blevesearch/bleve/v2/analysis/analyzer/keyword"
	"github.com/blevesearch/bleve/v2/analysis/analyzer/standard"
)

var (
	index     bleve.Index
	indexOnce sync.Once
)

// InitSearch 初始化搜索索引
func InitSearch(indexPath string) error {
	var err error
	indexOnce.Do(func() {
		if _, err = os.Stat(indexPath); os.IsNotExist(err) {
			// 创建新的索引
			mapping := bleve.NewIndexMapping()

			// 文件名使用标准分词
			nameFieldMapping := bleve.NewTextFieldMapping()
			nameFieldMapping.Analyzer = standard.Name

			// 内容使用标准分词
			contentFieldMapping := bleve.NewTextFieldMapping()
			contentFieldMapping.Analyzer = standard.Name

			// ID 和 UserID 使用关键字分词（不分词）
			keywordFieldMapping := bleve.NewTextFieldMapping()
			keywordFieldMapping.Analyzer = keyword.Name

			documentMapping := bleve.NewDocumentMapping()
			documentMapping.AddFieldMappingsAt("name", nameFieldMapping)
			documentMapping.AddFieldMappingsAt("content", contentFieldMapping)
			documentMapping.AddFieldMappingsAt("user_id", keywordFieldMapping)
			documentMapping.AddFieldMappingsAt("file_id", keywordFieldMapping)

			mapping.AddDocumentMapping("file", documentMapping)

			index, err = bleve.New(indexPath, mapping)
		} else {
			// 打开现有索引
			index, err = bleve.Open(indexPath)
		}
	})
	return err
}

// IndexFile 对文件内容建立索引
func IndexFile(fileID uint, userID uint, name string, content string) error {
	if index == nil {
		return nil
	}

	doc := map[string]interface{}{
		"file_id": fmt.Sprintf("%d", fileID),
		"user_id": fmt.Sprintf("%d", userID),
		"name":    name,
		"content": content,
		"type":    "file",
	}

	return index.Index(fmt.Sprintf("file_%d", fileID), doc)
}

// SearchFiles 搜索文件
func SearchFiles(userID uint, keywordStr string) ([]uint, error) {
	if index == nil {
		return nil, nil
	}

	// 构造查询：匹配文件名或内容，且属于当前用户
	userQuery := bleve.NewTermQuery(fmt.Sprintf("%d", userID))
	userQuery.SetField("user_id")

	matchQuery := bleve.NewMatchQuery(keywordStr)
	// 默认匹配 name 和 content 字段

	query := bleve.NewConjunctionQuery(userQuery, matchQuery)

	searchRequest := bleve.NewSearchRequest(query)
	searchRequest.Fields = []string{"file_id"}
	searchResult, err := index.Search(searchRequest)
	if err != nil {
		return nil, err
	}

	var fileIDs []uint
	for _, hit := range searchResult.Hits {
		var id uint
		fmt.Sscanf(hit.ID, "file_%d", &id)
		if id > 0 {
			fileIDs = append(fileIDs, id)
		}
	}

	return fileIDs, nil
}

// RemoveFromIndex 从索引中移除
func RemoveFromIndex(fileID uint) error {
	if index == nil {
		return nil
	}
	return index.Delete(fmt.Sprintf("file_%d", fileID))
}
