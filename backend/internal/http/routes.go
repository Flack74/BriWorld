package http

import (
	"briworld/internal/config"
	"briworld/internal/database"
	"briworld/internal/handlers"
	"briworld/internal/mailer"
	"briworld/internal/middleware"
	"briworld/internal/services"
	"briworld/internal/ws"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/websocket/v2"
)

func SetupRoutes(app *fiber.App, gormDB *database.GormDB, cfg *config.Config, m *mailer.Mailer) {
	authService := services.NewAuthServiceGorm(gormDB)
	authHandler := handlers.NewAuthHandlerGorm(authService, cfg.JWT.Secret, cfg.JWT.Expiry, m)

	// Static files (game data only - frontend served separately)
	app.Static("/static", "./static")
	app.Static("/Music", "./Music")

	app.Get("/api/v2/rooms", handlers.GetPublicRooms)

	api := app.Group("/api/v2")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"env":     cfg.Env,
			"version": "v2",
		})
	})

	auth := api.Group("/auth")
	auth.Use(limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
	}))
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/forgot-password", authHandler.ForgotPassword)

	// Profile routes (protected)
	profileHandler := handlers.NewProfileHandler(gormDB)
	avatarHandler := handlers.NewAvatarHandler(gormDB)
	rankingHandler := handlers.NewRankingHandler(gormDB.DB)

	profile := api.Group("/user")
	profile.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	profile.Get("/profile", profileHandler.GetProfile)
	profile.Put("/profile", profileHandler.UpdateProfile)
	profile.Post("/avatar", avatarHandler.UploadAvatar)
	profile.Delete("/avatar", avatarHandler.DeleteAvatar)

	// Meta system routes
	api.Get("/daily-challenge", handlers.GetDailyChallenge)
	api.Post("/daily-challenge/complete", middleware.AuthMiddleware(cfg.JWT.Secret), handlers.CompleteChallenge)
	api.Get("/rank", middleware.AuthMiddleware(cfg.JWT.Secret), handlers.GetUserRank)
	api.Get("/mastery", middleware.AuthMiddleware(cfg.JWT.Secret), handlers.GetUserMastery)
	api.Get("/achievements", middleware.AuthMiddleware(cfg.JWT.Secret), handlers.GetUserAchievements)

	// Ranking routes
	api.Get("/leaderboard", rankingHandler.GetLeaderboard)
	api.Get("/user/rank", middleware.AuthMiddleware(cfg.JWT.Secret), rankingHandler.GetUserRank)
	api.Get("/season", rankingHandler.GetActiveSeason)

	// WebSocket routes
	app.Use("/ws", ws.UpgradeWebSocket)
	app.Get("/ws", websocket.New(ws.HandleWebSocket))
	app.Get("/ws/spectate/:roomCode", websocket.New(ws.HandleSpectatorWebSocket))
}
