package main

import (
	"briworld/internal/bootstrap"
	"log"
	"os"
	"os/signal"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("⚠️  .env file not found or error loading: %v", err)
	} else {
		log.Println("✓ .env file loaded")
	}
	
	// Log current ENV value
	env := os.Getenv("ENV")
	log.Printf("ENV from environment: %s", env)
	
	// Ensure ENV is set to production if not already set
	if env == "" {
		log.Println("ENV not set, defaulting to production")
		os.Setenv("ENV", "production")
	}
	
	log.Printf("Final ENV value: %s", os.Getenv("ENV"))
	
	app, err := bootstrap.New()
	if err != nil {
		log.Fatal(err)
	}
	go app.Run()
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt)
	<-sig
	app.Shutdown()
}
