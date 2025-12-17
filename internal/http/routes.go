package http

import (
	"briworld/internal/config"
	"briworld/internal/database"
	"briworld/internal/handlers"
	"briworld/internal/middleware"
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

	// Static files
	app.Static("/static", "./static")
	app.Static("/assets", "./web-dist/assets")
	app.Static("/uploads", "./uploads")
	app.Static("/", "./web-dist", fiber.Static{
		Browse: false,
		Index:  "index.html",
	})
	
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

	// Profile routes (protected)
	profileHandler := handlers.NewProfileHandler(gormDB)
	avatarHandler := handlers.NewAvatarHandler(gormDB)
	
	profile := api.Group("/user")
	profile.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	profile.Get("/profile", profileHandler.GetProfile)
	profile.Put("/profile", profileHandler.UpdateProfile)
	profile.Post("/avatar", avatarHandler.UploadAvatar)
	profile.Delete("/avatar", profileHandler.DeleteAvatar)

	app.Use("/ws", ws.UpgradeWebSocket)
	app.Get("/ws", websocket.New(ws.HandleWebSocket))

	// Serve React app for all routes
	app.Get("/*", func(c *fiber.Ctx) error {
		return c.SendFile("./web-dist/index.html")
	})
}
