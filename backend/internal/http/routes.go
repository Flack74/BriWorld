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
	passwordResetHandler := handlers.NewPasswordResetHandler()

	// Root endpoint
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "BriWorld API",
			"version": "v2",
			"status":  "running",
		})
	})

	// Serve frontend static files
	app.Static("/", "./web-dist", fiber.Static{
		Compress:      true,
		Browse:        false,
		Index:         "index.html",
		CacheDuration: 24 * time.Hour,
	})

	// Static files (game data only)
	app.Static("/static", "./static")
	app.Static("/Music", "./Music")
	app.Static("/uploads", "./uploads")

	app.Get("/api/v2/rooms", handlers.GetPublicRooms)
	app.Post("/api/v2/rooms", handlers.CreateRoom)

	api := app.Group("/api/v2")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"env":     cfg.Env,
			"version": "v2",
		})
	})

	api.Get("/emoji/clues", handlers.GetEmojiCluesHandler)

	auth := api.Group("/auth")
	auth.Use(limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
	}))
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/forgot-password", passwordResetHandler.RequestPasswordReset)
	auth.Post("/reset-password", passwordResetHandler.ResetPassword)

	// Profile routes (protected)
	profileHandler := handlers.NewProfileHandler(gormDB)
	avatarHandler := handlers.NewAvatarHandler(gormDB)
	rankingHandler := handlers.NewRankingHandler(gormDB.DB, cfg.JWT.Secret)

	profile := api.Group("/user")
	profile.Use(middleware.AuthMiddleware(cfg.JWT.Secret))
	profile.Get("/profile", profileHandler.GetProfile)
	profile.Put("/profile", profileHandler.UpdateProfile)
	profile.Put("/profile/customization", profileHandler.SaveCustomization)
	profile.Post("/avatar", avatarHandler.UploadAvatar)
	profile.Delete("/avatar", avatarHandler.DeleteAvatar)
	profile.Post("/banner", avatarHandler.UploadBanner)
	profile.Delete("/banner", avatarHandler.DeleteBanner)
	profile.Post("/avatar-decoration", avatarHandler.UploadAvatarDecoration)
	profile.Delete("/avatar-decoration", avatarHandler.DeleteAvatarDecoration)
	profile.Get("/profile-assets", avatarHandler.ListProfileAssets)
	profile.Post("/profile-assets", avatarHandler.UploadProfileAsset)
	profile.Delete("/profile-assets/:assetId", avatarHandler.DeleteProfileAsset)

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
}
