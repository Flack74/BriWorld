package database

import (
	"briworld/internal/models"
	"log"
)

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
