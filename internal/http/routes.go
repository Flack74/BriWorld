package http

import (
	"briworld/internal/config"
	"briworld/internal/database"
	"briworld/internal/handlers"
	"briworld/internal/services"
	"briworld/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/websocket/v2"
	"time"
)

func SetupRoutes(app *fiber.App, gormDB *database.GormDB, cfg *config.Config) {
	authService := services.NewAuthServiceGorm(gormDB)
	authHandler := handlers.NewAuthHandlerGorm(authService, cfg.JWT.Secret, cfg.JWT.Expiry, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.Username, cfg.SMTP.Password, cfg.SMTP.From)

	app.Static("/static", "./static")
	
	app.Get("/api/rooms", handlers.GetPublicRooms)
	
	api := app.Group("/api")
	
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"env":    cfg.Env,
		})
	})
	
	auth := api.Group("/auth")
	auth.Use(limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
	}))
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/forgot-password", authHandler.ForgotPassword)

	app.Use("/ws", ws.UpgradeWebSocket)
	app.Get("/ws", websocket.New(ws.HandleWebSocket))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendFile("./web/index.html")
	})
	app.Get("/lobby", func(c *fiber.Ctx) error {
		return c.SendFile("./web/lobby.html")
	})
	app.Get("/game", func(c *fiber.Ctx) error {
		return c.SendFile("./web/game.html")
	})
	app.Get("/login", func(c *fiber.Ctx) error {
		return c.SendFile("./web/login.html")
	})
	app.Get("/register", func(c *fiber.Ctx) error {
		return c.SendFile("./web/register.html")
	})
	app.Get("/forgot-password", func(c *fiber.Ctx) error {
		return c.SendFile("./web/forgot-password.html")
	})
}
