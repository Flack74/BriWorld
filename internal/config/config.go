package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	DB    DBConfig
	JWT   JWTConfig
	Game  GameConfig
	SMTP  SMTPConfig
	Redis RedisConfig
	Port  string
	Env   string
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	Secret              string
	Expiry              int
	RefreshTokenExpiry  int
}

type GameConfig struct {
	MaxPlayersPerRoom   int
	RoundDurationSeconds int
	RoundsPerGame       int
}

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

type RedisConfig struct {
	Addr     string
	Password string
	DB       int
	TLS      bool
}

func Load() *Config {
	env := getEnv("ENV", "development")
	sslMode := "disable"
	if env == "production" {
		sslMode = "require"
	}
	
	return &Config{
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "briworld"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "briworld_db"),
			SSLMode:  getEnv("DB_SSL_MODE", sslMode),
		},
		JWT: JWTConfig{
			Secret:             getEnv("JWT_SECRET", "change-me-in-production"),
			Expiry:             getEnvInt("JWT_EXPIRY", 86400),
			RefreshTokenExpiry: getEnvInt("REFRESH_TOKEN_EXPIRY", 2592000),
		},
		Game: GameConfig{
			MaxPlayersPerRoom:   getEnvInt("MAX_PLAYERS_PER_ROOM", 6),
			RoundDurationSeconds: getEnvInt("ROUND_DURATION_SECONDS", 15),
			RoundsPerGame:       getEnvInt("ROUNDS_PER_GAME", 10),
		},
		SMTP: SMTPConfig{
			Host:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			Port:     getEnvInt("SMTP_PORT", 587),
			Username: getEnv("SMTP_USERNAME", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "noreply@briworld.com"),
		},
		Redis: RedisConfig{
			Addr:     getEnv("REDIS_ADDR", "localhost:6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
			TLS:      getEnv("REDIS_TLS", "false") == "true",
		},
		Port: getEnv("PORT", "8085"),
		Env:  env,
	}
}

func (c *Config) GetDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DB.Host, c.DB.Port, c.DB.User, c.DB.Password, c.DB.Name, c.DB.SSLMode)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
