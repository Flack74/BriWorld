package database

import (
	"briworld/internal/models"
	"fmt"
	"strings"
	"time"

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
		Logger: logger.Default.LogMode(logger.Error),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}

	// Set connection pool settings
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(20)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(5 * time.Minute)
	}

	// Skip AutoMigrate if tables already exist (production optimization)
	var count int64
	db.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'users'").Scan(&count)
	if count > 0 {
		// Tables exist, skip migration
		gormDB := &GormDB{DB: db}
		globalDB = gormDB
		return gormDB, nil
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
	
	// Migrate meta system tables
	if err := db.AutoMigrate(&models.DailyChallenge{}, &models.ChallengeCompletion{}, &models.Season{}, &models.SeasonRank{}, &models.CountryMastery{}, &models.Achievement{}, &models.UserAchievement{}, &models.CustomRoomRule{}); err != nil {
		if !isAlreadyExistsError(err) {
			return nil, fmt.Errorf("failed to migrate meta tables: %w", err)
		}
	}

	// Migrate ranking system tables
	if err := db.AutoMigrate(&models.RankHistory{}); err != nil {
		if !isAlreadyExistsError(err) {
			return nil, fmt.Errorf("failed to migrate rank_history: %w", err)
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
