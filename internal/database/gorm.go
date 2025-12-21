package database

import (
	"briworld/internal/models"
	"fmt"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type GormDB struct {
	DB *gorm.DB
}

var globalDB *GormDB

func NewGorm(dsn string) (*GormDB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	// Migrate tables individually to handle existing columns gracefully
	if err := db.AutoMigrate(&models.User{}); err != nil {
		// Ignore "already exists" errors
		if !isAlreadyExistsError(err) {
			return nil, fmt.Errorf("failed to migrate users: %w", err)
		}
	}
	if err := db.AutoMigrate(&models.Room{}); err != nil {
		if !isAlreadyExistsError(err) {
			return nil, fmt.Errorf("failed to migrate rooms: %w", err)
		}
	}
	if err := db.AutoMigrate(&models.GameSession{}); err != nil {
		if !isAlreadyExistsError(err) {
			return nil, fmt.Errorf("failed to migrate game_sessions: %w", err)
		}
	}
	if err := db.AutoMigrate(&models.Session{}); err != nil {
		if !isAlreadyExistsError(err) {
			return nil, fmt.Errorf("failed to migrate sessions: %w", err)
		}
	}

	gormDB := &GormDB{DB: db}
	globalDB = gormDB
	return gormDB, nil
}

func isAlreadyExistsError(err error) bool {
	if err == nil {
		return false
	}
	errorMsg := err.Error()
	return strings.Contains(errorMsg, "already exists") || strings.Contains(errorMsg, "42701") || strings.Contains(errorMsg, "42P07")
}

func GetDB() *GormDB {
	return globalDB
}
