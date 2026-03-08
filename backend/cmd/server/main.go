package main

import (
	"briworld/internal/bootstrap"
	"log"
	"os"
	"os/signal"

	"github.com/joho/godotenv"
)

func main() {
	// Log current ENV value if development .env else render
	env := os.Getenv("ENV")
	
	if env == "" || env == "development" {
		err := godotenv.Load()
		if err != nil {
			log.Println("No .env file found")
		}
	}
	
	
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
