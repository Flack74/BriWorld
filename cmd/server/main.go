package main

import (
	"briworld/internal/config"
	"briworld/internal/database"
	"briworld/internal/game"
	"briworld/internal/http"
	"briworld/internal/keepalive"
	"briworld/internal/ws"
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	cfg := config.Load()

	gormDB, err := database.NewGorm(cfg.GetDSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✓ GORM connected and migrated")

	if err := game.LoadCountries("static/world.json"); err != nil {
		log.Fatalf("Failed to load countries: %v", err)
	}
	log.Println("✓ Country data loaded from world.json")

	app := fiber.New(fiber.Config{
		AppName:      "BriWorld v1.0",
		ErrorHandler: customErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	http.SetupRoutes(app, gormDB, cfg)

	// Start room state cleanup
	ws.GetStateManager().StartCleanup()
	log.Println("✓ Room state manager started")

	keepalive.Start()

	log.Printf("🌍 BriWorld server starting on port %s", cfg.Port)
	log.Printf("📊 Environment: %s", cfg.Env)
	
	go func() {
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}()
	
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	
	<-c
	log.Println("🚦 Gracefully shutting down...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}
	
	log.Println("✅ Server exited properly")
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}
