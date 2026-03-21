package database

import (
	"briworld/internal/models"
	"log"
)

const profileCustomizationMigrationVersion = "2026_03_21_profile_customization_v2"

func MigrateProfileCustomization(db *GormDB) error {
	if err := db.DB.Exec(`
		CREATE TABLE IF NOT EXISTS profile_migration_versions (
			version VARCHAR(120) PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`).Error; err != nil {
		return err
	}

	var count int64
	if err := db.DB.Raw(
		`SELECT COUNT(*) FROM profile_migration_versions WHERE version = ?`,
		profileCustomizationMigrationVersion,
	).Scan(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		log.Printf("✓ Profile customization migration %s already applied", profileCustomizationMigrationVersion)
		return nil
	}

	tx := db.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	statements := []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(1024)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'image'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_type VARCHAR(20) DEFAULT 'image'`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_decoration_preset VARCHAR(64)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_decoration_url VARCHAR(1024)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_customization_json TEXT`,
		`ALTER TABLE users ALTER COLUMN avatar_url TYPE VARCHAR(1024)`,
		`ALTER TABLE users ALTER COLUMN banner_url TYPE VARCHAR(1024)`,
		`ALTER TABLE users ALTER COLUMN avatar_decoration_url TYPE VARCHAR(1024)`,
	}

	for _, stmt := range statements {
		if err := tx.Exec(stmt).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.AutoMigrate(&models.ProfileAsset{}, &models.ProfileDecoration{}); err != nil {
		tx.Rollback()
		return err
	}

	assetStatements := []string{
		`ALTER TABLE profile_assets ALTER COLUMN url TYPE VARCHAR(1024)`,
		`ALTER TABLE profile_decorations ALTER COLUMN asset_url TYPE VARCHAR(1024)`,
	}
	for _, stmt := range assetStatements {
		if err := tx.Exec(stmt).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Exec(
		`INSERT INTO profile_migration_versions (version) VALUES (?)`,
		profileCustomizationMigrationVersion,
	).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	log.Printf("✓ Profile customization migration %s applied", profileCustomizationMigrationVersion)
	return nil
}

func MigrateMetaTables(db *GormDB) error {
	// Use Error log level to suppress slow query warnings during migration
	db.DB.Logger = db.DB.Logger.LogMode(3) // Error level

	err := db.DB.AutoMigrate(
		&models.DailyChallenge{},
		&models.ChallengeCompletion{},
		&models.Season{},
		&models.SeasonRank{},
		&models.CountryMastery{},
		&models.Achievement{},
		&models.UserAchievement{},
		&models.CustomRoomRule{},
	)

	if err != nil {
		return err
	}

	log.Println("✓ Meta system migrations complete")
	return nil
}
