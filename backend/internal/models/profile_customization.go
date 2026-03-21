package models

import (
	"time"

	"github.com/google/uuid"
)

type ProfileAsset struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Kind         string    `gorm:"size:20;not null;index" json:"kind"`
	AssetType    string    `gorm:"size:20;not null" json:"asset_type"`
	Name         string    `gorm:"size:120" json:"name"`
	URL          string    `gorm:"size:512;not null" json:"url"`
	PublicID     string    `gorm:"size:255" json:"public_id"`
	ResourceType string    `gorm:"size:32" json:"resource_type"`
	MimeType     string    `gorm:"size:120" json:"mime_type"`
	FileSize     int64     `json:"file_size"`
	Provider     string    `gorm:"size:32;default:cloudinary" json:"provider"`
	MetadataJSON string    `gorm:"type:text" json:"metadata_json"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ProfileDecoration struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	AssetID    *uuid.UUID `gorm:"type:uuid;index" json:"asset_id,omitempty"`
	Name       string     `gorm:"size:120" json:"name"`
	Source     string     `gorm:"size:20;not null" json:"source"`
	AssetType  string     `gorm:"size:20;not null" json:"asset_type"`
	Target     string     `gorm:"size:20;not null;index" json:"target"`
	AssetURL   string     `gorm:"size:512;not null" json:"asset_url"`
	PositionX  float64    `gorm:"default:0" json:"position_x"`
	PositionY  float64    `gorm:"default:0" json:"position_y"`
	Scale      float64    `gorm:"default:1" json:"scale"`
	Rotation   float64    `gorm:"default:0" json:"rotation"`
	ZIndex     int        `gorm:"default:0" json:"z_index"`
	Loop       bool       `gorm:"default:true" json:"loop"`
	Speed      float64    `gorm:"default:1" json:"speed"`
	Enabled    bool       `gorm:"default:true" json:"enabled"`
	ConfigJSON string     `gorm:"type:text" json:"config_json"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}
