package database

import (
	"briworld/internal/models"
	"fmt"

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
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Room{},
		&models.GameSession{},
		&models.Session{},
	); err != nil {
		return nil, fmt.Errorf("failed to migrate: %w", err)
	}

	gormDB := &GormDB{DB: db}
	globalDB = gormDB
	return gormDB, nil
}

func GetDB() *GormDB {
	return globalDB
}
