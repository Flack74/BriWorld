package main

import (
	"briworld/internal/bootstrap"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env", "backend/.env", ".env.local", "backend/.env.local")
	if err != nil {
		log.Println("No local .env file found")
	}

	app, err := bootstrap.New()
	if err != nil {
		log.Fatal(err)
	}
	go app.Run()
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig
	app.Shutdown()
}
