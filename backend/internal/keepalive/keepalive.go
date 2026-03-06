package keepalive

import (
	"log"
	"net/http"
	"os"
	"time"
)

func Start() {
	if os.Getenv("ENV") != "production" {
		return
	}

	go func() {
		// Wait 2 minutes for app to fully start
		log.Println("Keep-alive: waiting 2 minutes for app to be ready...")
		time.Sleep(2 * time.Minute)
		log.Println("Keep-alive service started (10 min interval)")

		// First ping immediately
		ping()

		// Then ping every 10 minutes
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			ping()
		}
	}()
}

func ping() {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://briworld.onrender.com/api/health")
	if err != nil {
		log.Printf("Keep-alive ping failed: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Printf("Keep-alive ping successful: %d", resp.StatusCode)
}
