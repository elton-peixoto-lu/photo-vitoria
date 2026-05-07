package media

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"cloud.google.com/go/storage"
)

type Manifest struct {
	Version    int            `json:"version"`
	CreatedAt  string         `json:"createdAt,omitempty"`
	Folder     string         `json:"folder"`
	UploadedBy string         `json:"uploadedBy,omitempty"`
	Source     string         `json:"source,omitempty"`
	Files      []ManifestFile `json:"files"`
}

type ManifestFile struct {
	Bucket       string `json:"bucket"`
	ObjectPath   string `json:"objectPath"`
	OriginalName string `json:"originalName"`
	ContentType  string `json:"contentType"`
	Size         int64  `json:"size,omitempty"`
}

type ProcessRequest struct {
	Repo         string   `json:"repo,omitempty"`
	Branch       string   `json:"branch,omitempty"`
	ManifestPath string   `json:"manifestPath,omitempty"`
	Manifest     Manifest `json:"manifest"`
	DryRun       bool     `json:"dryRun,omitempty"`
}

type ProcessResponse struct {
	Folder          string   `json:"folder"`
	Processed       int      `json:"processed"`
	Skipped         int      `json:"skipped"`
	RemovedDupes    int      `json:"removedDuplicates"`
	Hydrated        int      `json:"hydratedFromManifests"`
	ChangedFiles    []string `json:"changedFiles,omitempty"`
	DeletedFiles    []string `json:"deletedFiles,omitempty"`
	CommittedBranch string   `json:"committedBranch,omitempty"`
	PublishedFiles  []string `json:"publishedFiles,omitempty"`
}

type GalleryIndex map[string][]string

type Service struct {
	logger          *slog.Logger
	storageClient   *storage.Client
	httpClient      *http.Client
	repoRoot        string
	githubToken     string
	watermarkPath   string
	nodeBin         string
	processScript   string
	loaderSource    string
	publicSourceDir string
	finalBucketName string
	indexObjectPath string
}

func NewService(ctx context.Context, logger *slog.Logger) (*Service, error) {
	if logger == nil {
		logger = slog.Default()
	}

	repoRoot := os.Getenv("IMAGE_WORKER_REPO_ROOT")
	if repoRoot == "" {
		repoRoot = "/workspace"
	}

	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("create storage client: %w", err)
	}

	nodeBin := os.Getenv("IMAGE_WORKER_NODE_BIN")
	if nodeBin == "" {
		nodeBin = "node"
	}

	processScript := os.Getenv("IMAGE_WORKER_PROCESS_SCRIPT")
	if processScript == "" {
		processScript = filepath.Join(repoRoot, "scripts", "processManifestWorker.mjs")
	}

	watermarkPath := os.Getenv("WATERMARK_LOGO_PATH")
	if watermarkPath == "" {
		watermarkPath = filepath.Join(repoRoot, "assets", "watermark-logo.svg")
	}

	loaderSource := filepath.Join(repoRoot, "src", "localAssetsLoader.js")
	publicSourceDir := filepath.Join(repoRoot, "public", "images", "galeria")
	finalBucketName := strings.TrimSpace(os.Getenv("FINAL_MEDIA_BUCKET"))
	if finalBucketName == "" {
		finalBucketName = "photo-vitoria-gallery-prod"
	}
	indexObjectPath := strings.TrimSpace(os.Getenv("GALLERY_INDEX_OBJECT"))
	if indexObjectPath == "" {
		indexObjectPath = "gallery-index.json"
	}

	return &Service{
		logger:          logger,
		storageClient:   storageClient,
		httpClient:      &http.Client{Timeout: 30 * time.Second},
		repoRoot:        repoRoot,
		githubToken:     os.Getenv("GITHUB_UPLOAD_TOKEN"),
		watermarkPath:   watermarkPath,
		nodeBin:         nodeBin,
		processScript:   processScript,
		loaderSource:    loaderSource,
		publicSourceDir: publicSourceDir,
		finalBucketName: finalBucketName,
		indexObjectPath: indexObjectPath,
	}, nil
}

func (s *Service) ProcessManifest(ctx context.Context, req ProcessRequest) (*ProcessResponse, error) {
	if req.Manifest.Folder == "" {
		return nil, errors.New("manifest.folder obrigatorio")
	}
	if len(req.Manifest.Files) == 0 {
		return nil, errors.New("manifest.files vazio")
	}

	workspace, err := os.MkdirTemp("", "photo-vitoria-worker-")
	if err != nil {
		return nil, fmt.Errorf("create workspace: %w", err)
	}
	defer os.RemoveAll(workspace)

	pendingDir := filepath.Join(workspace, "uploads", "pendentes")
	manifestsDir := filepath.Join(workspace, "uploads", "manifests")
	publicDir := filepath.Join(workspace, "public", "images", "galeria")
	loaderFile := filepath.Join(workspace, "src", "localAssetsLoader.js")

	if err := copyDir(s.publicSourceDir, publicDir); err != nil {
		return nil, fmt.Errorf("copy public dir: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(loaderFile), 0o755); err != nil {
		return nil, fmt.Errorf("mkdir loader dir: %w", err)
	}
	if err := copyFile(s.loaderSource, loaderFile); err != nil {
		return nil, fmt.Errorf("copy loader file: %w", err)
	}
	if err := os.MkdirAll(filepath.Join(pendingDir, req.Manifest.Folder), 0o755); err != nil {
		return nil, fmt.Errorf("mkdir pending dir: %w", err)
	}
	if err := os.MkdirAll(manifestsDir, 0o755); err != nil {
		return nil, fmt.Errorf("mkdir manifests dir: %w", err)
	}

	for _, item := range req.Manifest.Files {
		if err := s.downloadManifestFile(ctx, pendingDir, req.Manifest.Folder, item); err != nil {
			return nil, err
		}
	}

	beforeState, err := scanFolderState(filepath.Join(publicDir, req.Manifest.Folder))
	if err != nil {
		return nil, fmt.Errorf("scan before state: %w", err)
	}

	summary, err := s.runProcessor(ctx, pendingDir, manifestsDir, publicDir, loaderFile, req.Branch)
	if err != nil {
		return nil, err
	}

	afterState, err := scanFolderState(filepath.Join(publicDir, req.Manifest.Folder))
	if err != nil {
		return nil, fmt.Errorf("scan after state: %w", err)
	}

	changedFiles, deletedFiles, err := diffPublicFolder(req.Manifest.Folder, beforeState, afterState)
	if err != nil {
		return nil, err
	}

	loaderChanged, err := fileChanged(s.loaderSource, loaderFile)
	if err != nil {
		return nil, err
	}
	if loaderChanged {
		changedFiles = append(changedFiles, "src/localAssetsLoader.js")
	}
	sort.Strings(changedFiles)
	sort.Strings(deletedFiles)

	resp := &ProcessResponse{
		Folder:       req.Manifest.Folder,
		Processed:    summary.Processed,
		Skipped:      summary.Skipped,
		RemovedDupes: summary.RemovedDuplicates,
		Hydrated:     summary.HydratedFromManifests,
		ChangedFiles: changedFiles,
		DeletedFiles: deletedFiles,
	}

	if req.DryRun {
		return resp, nil
	}

	if req.Repo != "" && req.Branch != "" {
		if s.githubToken == "" {
			return nil, errors.New("GITHUB_UPLOAD_TOKEN nao configurado")
		}
		if err := s.publishToGitHub(ctx, req, publicDir, loaderFile, changedFiles, deletedFiles); err != nil {
			return nil, err
		}
		resp.CommittedBranch = req.Branch
		return resp, nil
	}

	publishedFiles, err := s.publishToStorage(ctx, req, publicDir, changedFiles, deletedFiles)
	if err != nil {
		return nil, err
	}
	resp.PublishedFiles = publishedFiles

	return resp, nil
}

type processorSummary struct {
	Processed             int `json:"processed"`
	Skipped               int `json:"skipped"`
	RemovedDuplicates     int `json:"removedDuplicates"`
	HydratedFromManifests int `json:"hydratedFromManifests"`
}

func (s *Service) runProcessor(ctx context.Context, pendingDir, manifestsDir, publicDir, loaderFile, branchName string) (*processorSummary, error) {
	payload := map[string]any{
		"pendingDir":        pendingDir,
		"manifestsDir":      manifestsDir,
		"publicDir":         publicDir,
		"loaderFile":        loaderFile,
		"branchName":        branchName,
		"watermarkLogoPath": s.watermarkPath,
		"requireWatermark":  true,
	}
	body, _ := json.Marshal(payload)

	cmd := exec.CommandContext(ctx, s.nodeBin, s.processScript, string(body))
	cmd.Dir = s.repoRoot
	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("processor failed: %w\n%s", err, string(out))
	}

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) == 0 {
		return nil, errors.New("processor returned empty output")
	}
	last := lines[len(lines)-1]
	var summary processorSummary
	if err := json.Unmarshal([]byte(last), &summary); err != nil {
		return nil, fmt.Errorf("parse processor output: %w\n%s", err, string(out))
	}
	return &summary, nil
}

func (s *Service) downloadManifestFile(ctx context.Context, pendingDir, folder string, item ManifestFile) error {
	if item.Bucket == "" || item.ObjectPath == "" || item.OriginalName == "" {
		return errors.New("manifest file invalido")
	}
	if !strings.HasPrefix(item.ObjectPath, "incoming/"+folder+"/") {
		return fmt.Errorf("objeto fora do folder esperado: %s", item.ObjectPath)
	}

	dest := filepath.Join(pendingDir, folder, filepath.Base(item.ObjectPath))
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return err
	}

	obj := s.storageClient.Bucket(item.Bucket).Object(item.ObjectPath)
	r, err := obj.NewReader(ctx)
	if err != nil {
		return fmt.Errorf("open object %s: %w", item.ObjectPath, err)
	}
	defer r.Close()

	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	h := sha1.New()
	mw := io.MultiWriter(f, h)
	written, err := io.Copy(mw, r)
	if err != nil {
		return fmt.Errorf("download object %s: %w", item.ObjectPath, err)
	}
	if item.Size > 0 && written != item.Size {
		return fmt.Errorf("tamanho inesperado para %s (%d != %d)", item.ObjectPath, written, item.Size)
	}
	return nil
}

type fileState struct {
	RelPath string
	SHA1    string
	AbsPath string
}

func scanFolderState(root string) (map[string]fileState, error) {
	state := map[string]fileState{}
	if _, err := os.Stat(root); errors.Is(err, os.ErrNotExist) {
		return state, nil
	}
	if err := filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(root, p)
		if err != nil {
			return err
		}
		hash, err := sha1File(p)
		if err != nil {
			return err
		}
		state[filepath.ToSlash(rel)] = fileState{RelPath: filepath.ToSlash(rel), SHA1: hash, AbsPath: p}
		return nil
	}); err != nil {
		return nil, err
	}
	return state, nil
}

func diffPublicFolder(folder string, before, after map[string]fileState) ([]string, []string, error) {
	var changed []string
	var deleted []string
	for rel, next := range after {
		prev, ok := before[rel]
		if !ok || prev.SHA1 != next.SHA1 {
			changed = append(changed, filepath.ToSlash(filepath.Join("public/images/galeria", folder, rel)))
		}
	}
	for rel := range before {
		if _, ok := after[rel]; !ok {
			deleted = append(deleted, filepath.ToSlash(filepath.Join("public/images/galeria", folder, rel)))
		}
	}
	return changed, deleted, nil
}

func fileChanged(a, b string) (bool, error) {
	ha, err := sha1File(a)
	if err != nil {
		return false, err
	}
	hb, err := sha1File(b)
	if err != nil {
		return false, err
	}
	return ha != hb, nil
}

func sha1File(p string) (string, error) {
	data, err := os.ReadFile(p)
	if err != nil {
		return "", err
	}
	sum := sha1.Sum(data)
	return fmt.Sprintf("%x", sum[:]), nil
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0o644)
}

func copyDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	return filepath.WalkDir(src, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, p)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		return copyFile(p, target)
	})
}

type githubContent struct {
	SHA string `json:"sha"`
}

func (s *Service) publishToGitHub(ctx context.Context, req ProcessRequest, publicDir, loaderFile string, changedFiles, deletedFiles []string) error {
	for _, rel := range changedFiles {
		var abs string
		if rel == "src/localAssetsLoader.js" {
			abs = loaderFile
		} else {
			abs = filepath.Join(publicDir, strings.TrimPrefix(rel, "public/images/galeria/"))
		}
		if err := s.putGitHubFile(ctx, req.Repo, req.Branch, rel, abs); err != nil {
			return err
		}
	}
	for _, rel := range deletedFiles {
		if err := s.deleteGitHubFile(ctx, req.Repo, req.Branch, rel); err != nil {
			return err
		}
	}
	if req.ManifestPath != "" {
		if err := s.deleteGitHubFile(ctx, req.Repo, req.Branch, req.ManifestPath); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) putGitHubFile(ctx context.Context, repo, branch, relPath, absPath string) error {
	data, err := os.ReadFile(absPath)
	if err != nil {
		return err
	}
	encoded := base64.StdEncoding.EncodeToString(data)
	payload := map[string]any{
		"message": fmt.Sprintf("Worker publish %s", relPath),
		"content": encoded,
		"branch":  branch,
	}
	sha, _ := s.fetchGitHubSHA(ctx, repo, branch, relPath)
	if sha != "" {
		payload["sha"] = sha
	}
	return s.githubJSON(ctx, http.MethodPut, fmt.Sprintf("https://api.github.com/repos/%s/contents/%s", repo, relPath), payload, nil)
}

func (s *Service) deleteGitHubFile(ctx context.Context, repo, branch, relPath string) error {
	sha, err := s.fetchGitHubSHA(ctx, repo, branch, relPath)
	if err != nil {
		return err
	}
	if sha == "" {
		return nil
	}
	payload := map[string]any{
		"message": fmt.Sprintf("Worker delete %s", relPath),
		"branch":  branch,
		"sha":     sha,
	}
	return s.githubJSON(ctx, http.MethodDelete, fmt.Sprintf("https://api.github.com/repos/%s/contents/%s", repo, relPath), payload, nil)
}

func (s *Service) fetchGitHubSHA(ctx context.Context, repo, branch, relPath string) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/contents/%s?ref=%s", repo, relPath, branch)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+s.githubToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "photo-vitoria-image-worker")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return "", nil
	}
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("github GET %s: %s", relPath, string(body))
	}
	var out githubContent
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	return out.SHA, nil
}

func (s *Service) githubJSON(ctx context.Context, method, url string, payload any, out any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, method, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.githubToken)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "photo-vitoria-image-worker")
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("github %s failed: %s", method, string(raw))
	}
	if out != nil {
		return json.NewDecoder(resp.Body).Decode(out)
	}
	return nil
}

func (s *Service) publishToStorage(ctx context.Context, req ProcessRequest, publicDir string, changedFiles, deletedFiles []string) ([]string, error) {
	finalBucket := s.storageClient.Bucket(s.finalBucketName)
	publishedFiles := make([]string, 0, len(changedFiles))

	for _, rel := range changedFiles {
		if !strings.HasPrefix(rel, "public/images/galeria/") {
			continue
		}

		objectPath := strings.TrimPrefix(rel, "public/")
		absPath := filepath.Join(publicDir, strings.TrimPrefix(rel, "public/images/galeria/"))
		if err := uploadFileToBucket(ctx, finalBucket, objectPath, absPath); err != nil {
			return nil, err
		}
		publishedFiles = append(publishedFiles, objectPath)
	}

	for _, rel := range deletedFiles {
		if !strings.HasPrefix(rel, "public/images/galeria/") {
			continue
		}

		objectPath := strings.TrimPrefix(rel, "public/")
		if err := finalBucket.Object(objectPath).Delete(ctx); err != nil && !strings.Contains(err.Error(), "object doesn't exist") {
			return nil, fmt.Errorf("delete object %s: %w", objectPath, err)
		}
	}

	index, err := s.buildGalleryIndex(publicDir)
	if err != nil {
		return nil, err
	}
	if err := uploadJSONToBucket(ctx, finalBucket, s.indexObjectPath, index); err != nil {
		return nil, err
	}

	for _, item := range req.Manifest.Files {
		if item.Bucket == "" || item.ObjectPath == "" {
			continue
		}
		if err := s.storageClient.Bucket(item.Bucket).Object(item.ObjectPath).Delete(ctx); err != nil && !strings.Contains(err.Error(), "object doesn't exist") {
			s.logger.Warn("falha ao remover objeto temporario", "objectPath", item.ObjectPath, "error", err)
		}
	}

	return publishedFiles, nil
}

func (s *Service) buildGalleryIndex(publicDir string) (GalleryIndex, error) {
	index := GalleryIndex{}
	folders, err := os.ReadDir(publicDir)
	if err != nil {
		return nil, fmt.Errorf("read public dir: %w", err)
	}

	for _, folder := range folders {
		if !folder.IsDir() {
			continue
		}
		folderName := folder.Name()
		folderPath := filepath.Join(publicDir, folderName)
		files, err := os.ReadDir(folderPath)
		if err != nil {
			return nil, fmt.Errorf("read folder %s: %w", folderName, err)
		}

		var names []string
		for _, file := range files {
			if file.IsDir() || strings.HasPrefix(file.Name(), ".") {
				continue
			}
			names = append(names, file.Name())
		}
		sort.Strings(names)
		index[folderName] = names
	}

	return index, nil
}

func uploadFileToBucket(ctx context.Context, bucket *storage.BucketHandle, objectPath, sourcePath string) error {
	contentType := mimeTypeForPath(objectPath)
	cacheControl := "public, max-age=3600"

	writer := bucket.Object(objectPath).NewWriter(ctx)
	writer.ContentType = contentType
	writer.CacheControl = cacheControl

	file, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("open source file %s: %w", sourcePath, err)
	}
	defer file.Close()

	if _, err := io.Copy(writer, file); err != nil {
		_ = writer.Close()
		return fmt.Errorf("upload object %s: %w", objectPath, err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("finalize object %s: %w", objectPath, err)
	}
	return nil
}

func uploadJSONToBucket(ctx context.Context, bucket *storage.BucketHandle, objectPath string, payload any) error {
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal %s: %w", objectPath, err)
	}

	writer := bucket.Object(objectPath).NewWriter(ctx)
	writer.ContentType = "application/json; charset=utf-8"
	writer.CacheControl = "public, max-age=60"
	if _, err := writer.Write(data); err != nil {
		_ = writer.Close()
		return fmt.Errorf("write %s: %w", objectPath, err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("finalize %s: %w", objectPath, err)
	}
	return nil
}

func mimeTypeForPath(objectPath string) string {
	switch strings.ToLower(filepath.Ext(objectPath)) {
	case ".avif":
		return "image/avif"
	case ".webp":
		return "image/webp"
	case ".png":
		return "image/png"
	case ".json":
		return "application/json; charset=utf-8"
	default:
		return "image/jpeg"
	}
}
