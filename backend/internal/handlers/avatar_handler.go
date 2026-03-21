package handlers

import (
	"briworld/internal/database"
	"briworld/internal/models"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AvatarHandler struct {
	db  *database.GormDB
	cld *cloudinary.Cloudinary
}

func (h *AvatarHandler) ensureProfileSchema() error {
	return database.MigrateProfileCustomization(h.db)
}

func NewAvatarHandler(db *database.GormDB) *AvatarHandler {
	var cld *cloudinary.Cloudinary
	var err error

	// Try to initialize from environment variable first
	cloudinaryURL := os.Getenv("CLOUDINARY_API_ENVIRONMENT_VARIABLE")
	if cloudinaryURL != "" {
		cld, err = cloudinary.NewFromURL(cloudinaryURL)
		if err != nil {
			log.Printf("Warning: Failed to initialize Cloudinary from URL: %v", err)
		}
	}

	// Fallback: Initialize from individual credentials
	if cld == nil {
		cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
		if cloudName == "" {
			cloudName = os.Getenv("CLOUDINARY_ClOUD_NAME") // Fallback for typo
		}
		apiKey := os.Getenv("CLOUDINARY_API_KEY")
		apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

		if cloudName != "" && apiKey != "" && apiSecret != "" {
			cld, err = cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
			if err != nil {
				log.Printf("Warning: Failed to initialize Cloudinary from params: %v", err)
			}
		}
	}

	if cld == nil {
		log.Printf("Warning: Cloudinary not configured - avatars will not be uploaded")
	}

	return &AvatarHandler{db: db, cld: cld}
}

func (h *AvatarHandler) parseUserID(c *fiber.Ctx) (uuid.UUID, error) {
	userIDVal := c.Locals("user_id")
	switch v := userIDVal.(type) {
	case uuid.UUID:
		return v, nil
	case string:
		return uuid.Parse(v)
	default:
		return uuid.Nil, fmt.Errorf("invalid user ID format")
	}
}

func validateImageFile(file *multipart.FileHeader, maxSize int64) error {
	if file.Size > maxSize {
		return fmt.Errorf("file size must be less than %dMB", maxSize/(1024*1024))
	}

	filename := strings.ToLower(file.Filename)
	allowedExts := []string{".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}
	for _, ext := range allowedExts {
		if strings.HasSuffix(filename, ext) {
			return nil
		}
	}

	return fmt.Errorf("only JPG, PNG, WebP, GIF, AVIF, and SVG files are allowed")
}

func detectAssetKind(file *multipart.FileHeader) (string, int64, string, error) {
	contentType := strings.ToLower(file.Header.Get("Content-Type"))
	ext := strings.ToLower(filepath.Ext(file.Filename))

	if ext == ".json" || strings.Contains(contentType, "json") {
		return "lottie", 5 * 1024 * 1024, "raw", nil
	}
	if ext == ".gif" || strings.Contains(contentType, "gif") {
		return "gif", 25 * 1024 * 1024, "image", nil
	}
	if strings.HasPrefix(contentType, "image/") || ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" || ext == ".avif" || ext == ".svg" {
		return "image", 15 * 1024 * 1024, "image", nil
	}

	return "", 0, "", fmt.Errorf("unsupported asset type")
}

func validateAssetFile(file *multipart.FileHeader, allowed map[string]bool) (string, string, error) {
	assetType, maxSize, resourceType, err := detectAssetKind(file)
	if err != nil {
		return "", "", err
	}
	if !allowed[assetType] {
		return "", "", fmt.Errorf("asset type %s is not allowed here", assetType)
	}
	if file.Size > maxSize {
		return "", "", fmt.Errorf("file size exceeds limit for %s", assetType)
	}
	return assetType, resourceType, nil
}

func (h *AvatarHandler) uploadToCloudinary(file *multipart.FileHeader, publicID, folder, resourceType string) (string, error) {
	if h.cld == nil {
		return "", fmt.Errorf("upload service not configured")
	}

	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to read file")
	}
	defer src.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	uploadResult, err := h.cld.Upload.Upload(ctx, src, uploader.UploadParams{
		PublicID:     publicID,
		Folder:       folder,
		ResourceType: resourceType,
	})
	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}

func saveUploadedFile(file *multipart.FileHeader, destination string) error {
	src, err := file.Open()
	if err != nil {
		return fmt.Errorf("failed to read file")
	}
	defer src.Close()

	dst, err := os.Create(destination)
	if err != nil {
		return fmt.Errorf("failed to create file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return fmt.Errorf("failed to write file")
	}

	return nil
}

func (h *AvatarHandler) uploadAsset(file *multipart.FileHeader, publicID, folder, resourceType string) (string, string, error) {
	if h.cld != nil {
		url, err := h.uploadToCloudinary(file, publicID, folder, resourceType)
		if err == nil {
			return url, "cloudinary", nil
		}
		log.Printf("Warning: cloudinary upload failed, falling back to local storage: %v", err)
	}

	cleanFolder := strings.TrimPrefix(filepath.Clean(folder), "/")
	diskDir := filepath.Join("uploads", cleanFolder)
	if err := os.MkdirAll(diskDir, 0o755); err != nil {
		return "", "", fmt.Errorf("failed to create upload directory")
	}

	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), strings.ToLower(filepath.Ext(file.Filename)))
	diskPath := filepath.Join(diskDir, filename)
	if err := saveUploadedFile(file, diskPath); err != nil {
		return "", "", err
	}

	return fmt.Sprintf("/uploads/%s/%s", filepath.ToSlash(cleanFolder), filename), "local", nil
}

func (h *AvatarHandler) createProfileAsset(userID uuid.UUID, kind, assetType string, file *multipart.FileHeader, url, publicID, resourceType, provider string, metadata map[string]any) {
	metadataJSON, _ := json.Marshal(metadata)
	row := models.ProfileAsset{
		UserID:       userID,
		Kind:         kind,
		AssetType:    assetType,
		Name:         file.Filename,
		URL:          url,
		PublicID:     publicID,
		ResourceType: resourceType,
		MimeType:     file.Header.Get("Content-Type"),
		FileSize:     file.Size,
		Provider:     provider,
		MetadataJSON: string(metadataJSON),
	}
	if err := h.db.DB.Create(&row).Error; err != nil {
		log.Printf("Warning: failed to persist profile asset metadata: %v", err)
	}
}

// UploadAvatar handles avatar file upload to Cloudinary
func (h *AvatarHandler) UploadAvatar(c *fiber.Ctx) error {
	if err := h.ensureProfileSchema(); err != nil {
		log.Printf("Error ensuring profile schema before avatar upload: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Profile schema migration failed",
		})
	}

	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get uploaded file
	file, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	assetType, resourceType, err := validateAssetFile(file, map[string]bool{
		"image": true,
		"gif":   true,
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	publicID := fmt.Sprintf("briworld/avatars/%s", userID.String())
	avatarURL, provider, err := h.uploadAsset(
		file,
		publicID,
		"briworld/avatars",
		resourceType,
	)
	if err != nil {
		log.Printf("Error uploading to Cloudinary: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to upload avatar",
		})
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
		"avatar_url":  avatarURL,
		"avatar_type": assetType,
	}).Error; err != nil {
		log.Printf("Error updating avatar URL: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update avatar",
		})
	}

	h.createProfileAsset(userID, "avatar", assetType, file, avatarURL, publicID, resourceType, provider, map[string]any{
		"usage": "current_avatar",
	})

	return c.JSON(fiber.Map{
		"message":     "Avatar uploaded successfully",
		"avatar_url":  avatarURL,
		"avatar_type": assetType,
	})
}

// DeleteAvatar handles avatar deletion
func (h *AvatarHandler) DeleteAvatar(c *fiber.Ctx) error {
	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Delete from Cloudinary
	if h.cld != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		_, err := h.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: fmt.Sprintf("briworld/avatars/%s", userID.String()),
		})
		if err != nil {
			log.Printf("Warning: Failed to delete from Cloudinary: %v", err)
		}
	}

	// Update user's avatar URL to empty
	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
		"avatar_url":  "",
		"avatar_type": "image",
	}).Error; err != nil {
		log.Printf("Error updating avatar URL: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete avatar",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Avatar deleted successfully",
	})
}

func (h *AvatarHandler) UploadBanner(c *fiber.Ctx) error {
	if err := h.ensureProfileSchema(); err != nil {
		log.Printf("Error ensuring profile schema before banner upload: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Profile schema migration failed"})
	}

	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	file, err := c.FormFile("banner")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No file uploaded"})
	}

	assetType, resourceType, err := validateAssetFile(file, map[string]bool{
		"image":  true,
		"gif":    true,
		"lottie": true,
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	publicID := fmt.Sprintf("briworld/banners/%s", userID.String())
	bannerURL, provider, err := h.uploadAsset(
		file,
		publicID,
		"briworld/banners",
		resourceType,
	)
	if err != nil {
		log.Printf("Error uploading banner: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Banner upload failed: %v", err)})
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
		"banner_url":  bannerURL,
		"banner_type": assetType,
	}).Error; err != nil {
		log.Printf("Error updating banner metadata: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Failed to save banner metadata: %v", err)})
	}

	h.createProfileAsset(userID, "banner", assetType, file, bannerURL, publicID, resourceType, provider, map[string]any{
		"usage": "current_banner",
	})

	return c.JSON(fiber.Map{
		"message":     "Banner uploaded successfully",
		"banner_url":  bannerURL,
		"banner_type": assetType,
	})
}

func (h *AvatarHandler) DeleteBanner(c *fiber.Ctx) error {
	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	if h.cld != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_, err := h.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: fmt.Sprintf("briworld/banners/%s", userID.String()),
		})
		if err != nil {
			log.Printf("Warning: Failed to delete banner from Cloudinary: %v", err)
		}
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]any{
		"banner_url":  "",
		"banner_type": "image",
	}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete banner"})
	}

	return c.JSON(fiber.Map{"message": "Banner deleted successfully"})
}

func (h *AvatarHandler) UploadAvatarDecoration(c *fiber.Ctx) error {
	if err := h.ensureProfileSchema(); err != nil {
		log.Printf("Error ensuring profile schema before decoration upload: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Profile schema migration failed"})
	}

	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	file, err := c.FormFile("avatar_decoration")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No file uploaded"})
	}

	assetType, resourceType, err := validateAssetFile(file, map[string]bool{
		"image":  true,
		"gif":    true,
		"lottie": true,
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	publicID := fmt.Sprintf("briworld/avatar-decorations/%s", userID.String())
	decorationURL, provider, err := h.uploadAsset(
		file,
		publicID,
		"briworld/avatar-decorations",
		resourceType,
	)
	if err != nil {
		log.Printf("Error uploading avatar decoration: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload avatar decoration"})
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"avatar_decoration_url":    decorationURL,
		"avatar_decoration_preset": "",
	}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update avatar decoration"})
	}

	h.createProfileAsset(userID, "decoration", assetType, file, decorationURL, publicID, resourceType, provider, map[string]any{
		"usage": "avatar_decoration",
	})

	return c.JSON(fiber.Map{
		"message":               "Avatar decoration uploaded successfully",
		"avatar_decoration_url": decorationURL,
		"asset_type":            assetType,
	})
}

func (h *AvatarHandler) DeleteAvatarDecoration(c *fiber.Ctx) error {
	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	if h.cld != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_, err := h.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: fmt.Sprintf("briworld/avatar-decorations/%s", userID.String()),
		})
		if err != nil {
			log.Printf("Warning: Failed to delete avatar decoration from Cloudinary: %v", err)
		}
	}

	if err := h.db.DB.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"avatar_decoration_url":    "",
		"avatar_decoration_preset": "",
	}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete avatar decoration"})
	}

	return c.JSON(fiber.Map{"message": "Avatar decoration deleted successfully"})
}

func (h *AvatarHandler) ListProfileAssets(c *fiber.Ctx) error {
	if err := h.ensureProfileSchema(); err != nil {
		log.Printf("Error ensuring profile schema before assets list: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Profile schema migration failed"})
	}

	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var assets []models.ProfileAsset
	if err := h.db.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&assets).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load assets"})
	}

	return c.JSON(fiber.Map{"assets": assets})
}

func (h *AvatarHandler) UploadProfileAsset(c *fiber.Ctx) error {
	if err := h.ensureProfileSchema(); err != nil {
		log.Printf("Error ensuring profile schema before asset upload: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Profile schema migration failed"})
	}

	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	file, err := c.FormFile("asset")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No file uploaded"})
	}

	assetType, resourceType, err := validateAssetFile(file, map[string]bool{
		"image":  true,
		"gif":    true,
		"lottie": true,
	})
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	kind := c.FormValue("kind", "decoration")
	if kind == "" {
		kind = "decoration"
	}
	name := c.FormValue("name", file.Filename)
	target := c.FormValue("target", "avatar")
	publicID := fmt.Sprintf("briworld/profile-assets/%s/%d", userID.String(), time.Now().UnixNano())

	url, provider, err := h.uploadAsset(file, publicID, "briworld/profile-assets", resourceType)
	if err != nil {
		log.Printf("Error uploading profile asset: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload asset"})
	}

	metadataJSON, _ := json.Marshal(map[string]any{
		"target":            target,
		"original_filename": file.Filename,
	})

	row := models.ProfileAsset{
		UserID:       userID,
		Kind:         kind,
		AssetType:    assetType,
		Name:         name,
		URL:          url,
		PublicID:     publicID,
		ResourceType: resourceType,
		MimeType:     file.Header.Get("Content-Type"),
		FileSize:     file.Size,
		Provider:     provider,
		MetadataJSON: string(metadataJSON),
	}

	if err := h.db.DB.Create(&row).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to save asset metadata"})
	}

	return c.JSON(row)
}

func (h *AvatarHandler) DeleteProfileAsset(c *fiber.Ctx) error {
	userID, err := h.parseUserID(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	assetID, err := uuid.Parse(c.Params("assetId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid asset ID"})
	}

	var asset models.ProfileAsset
	if err := h.db.DB.Where("id = ? AND user_id = ?", assetID, userID).First(&asset).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Asset not found"})
	}

	if asset.Provider == "cloudinary" && h.cld != nil && asset.PublicID != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_, err := h.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID:     asset.PublicID,
			ResourceType: asset.ResourceType,
		})
		if err != nil {
			log.Printf("Warning: failed to delete profile asset from cloudinary: %v", err)
		}
	} else if asset.Provider == "local" && strings.HasPrefix(asset.URL, "/uploads/") {
		localPath := filepath.Clean(strings.TrimPrefix(asset.URL, "/"))
		if err := os.Remove(localPath); err != nil && !os.IsNotExist(err) {
			log.Printf("Warning: failed to delete local profile asset: %v", err)
		}
	}

	if err := h.db.DB.Delete(&asset).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete asset"})
	}

	return c.JSON(fiber.Map{"message": "Asset deleted successfully"})
}
