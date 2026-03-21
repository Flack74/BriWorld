package bootstrap

import (
	"briworld/internal/config"
	"briworld/internal/database"
	"briworld/internal/game"
	"briworld/internal/http"
	"briworld/internal/keepalive"
	"briworld/internal/mailer"
	"briworld/internal/redis"
	"briworld/internal/services"
	"briworld/internal/ws"
	"context"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type App struct {
	fiber  *fiber.App
	cfg    *config.Config
	mailer *mailer.Mailer
}

func New() (*App, error) {
	cfg := config.Load()

	// Database
	gormDB, err := database.NewGorm(cfg.GetDSN())
	if err != nil {
		return nil, err
	}
	log.Println("✅ Database connected")

	// Migrations (skip if tables exist for faster startup)
	var tableCount int64
	gormDB.DB.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name IN ('users', 'rooms', 'game_sessions')").Scan(&tableCount)

	if tableCount < 3 {
		log.Println("Running initial migrations...")
		if err := database.MigrateMetaTables(gormDB); err != nil {
			log.Printf("⚠️  Meta migrations failed: %v", err)
		} else {
			services.SeedMetaSystem()
		}
	} else {
		log.Println("✓ Tables exist, skipping migrations")
	}

	if err := database.MigrateProfileCustomization(gormDB); err != nil {
		log.Printf("⚠️  Profile customization migrations failed: %v", err)
	}

	// Redis
	if err := redis.InitRedis(cfg.Redis.Addr, cfg.Redis.Password, cfg.Redis.DB, cfg.Redis.TLS); err != nil {
		log.Printf("⚠️  Redis unavailable: %v", err)
	} else {
		log.Println("✅ Redis connected")
	}

	// Mailer (Brevo SMTP) - non-blocking initialization
	smtpPort, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if smtpPort == 0 {
		smtpPort = 587
	}
	m := mailer.New(
		os.Getenv("SMTP_HOST"),
		smtpPort,
		os.Getenv("SMTP_USERNAME"),
		os.Getenv("SMTP_PASSWORD"),
	)
	if os.Getenv("SMTP_HOST") != "" {
		log.Println("✓ Mailer initialized")
	} else {
		log.Println("⚠️  SMTP not configured, email features disabled")
	}

	// Game data
	if err := game.LoadStaticData(); err != nil {
		return nil, err
	}
	log.Println("✓ Game Data Loaded")

	// Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "BriWorld v2.0",
		ErrorHandler: customErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New())

	// CORS configuration for decoupled frontend
	allowedOrigins := getAllowedOrigins()
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	http.SetupRoutes(app, gormDB, cfg, m)

	ws.GetStateManager().StartCleanup()
	ws.InitGameStartWorkers(10)
	keepalive.Start()

	log.Printf("🌍 BriWorld ready on port %s", cfg.Port)

	return &App{fiber: app, cfg: cfg, mailer: m}, nil
}

func (a *App) Run() error {
	return a.fiber.Listen(":" + a.cfg.Port)
}

func (a *App) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	redis.Close()
	return a.fiber.ShutdownWithContext(ctx)
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{"error": err.Error()})
}

// getAllowedOrigins returns CORS allowed origins based on environment
func getAllowedOrigins() string {
	// Production: Origins based on environment
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		return origins
	}
	// Development: Allow localhost on common ports
	return "http://localhost:5173"
}
