package redis

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func InitRedis(addr, password string, db int, useTLS bool) error {
	log.Printf("Initializing Redis with addr=%s, TLS=%v", addr, useTLS)
	
	var tlsConfig *tls.Config
	if useTLS {
		tlsConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}
	
	Client = redis.NewClient(&redis.Options{
		Addr:         addr,
		Password:     password,
		DB:           db,
		DialTimeout:  10 * time.Second,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		PoolSize:     20,
		MinIdleConns: 5,
		MaxRetries:   3,
		PoolTimeout:  10 * time.Second,
		TLSConfig:    tlsConfig,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := Client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis connection failed: %w", err)
	}

	log.Println("✅ Redis connected")
	return nil
}

func Close() error {
	if Client != nil {
		return Client.Close()
	}
	return nil
}
