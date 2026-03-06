package handlers

import (
	"briworld/internal/mailer"
	"briworld/internal/models"
	"briworld/internal/services"
	"briworld/internal/utils"
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken string               `json:"access_token"`
	ExpiresIn   int                  `json:"expires_in"`
	User        *models.UserResponse `json:"user"`
}

type AuthHandlerGorm struct {
	authService *services.AuthServiceGorm
	jwtSecret   string
	jwtExpiry   int
	mailer      *mailer.Mailer
}

func NewAuthHandlerGorm(authService *services.AuthServiceGorm, jwtSecret string, jwtExpiry int, m *mailer.Mailer) *AuthHandlerGorm {
	return &AuthHandlerGorm{
		authService: authService,
		jwtSecret:   jwtSecret,
		jwtExpiry:   jwtExpiry,
		mailer:      m,
	}
}

func (h *AuthHandlerGorm) Register(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	req.Username = utils.SanitizeInput(req.Username)
	req.Email = utils.SanitizeInput(req.Email)

	if !utils.ValidateEmail(req.Email) {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid email address"})
	}

	if !utils.ValidatePasswordStrength(req.Password) {
		return c.Status(400).JSON(fiber.Map{"error": "Password must be 8+ chars with uppercase, digit, and special char"})
	}

	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to process password"})
	}

	user, err := h.authService.RegisterUser(ctx, req.Username, req.Email, passwordHash)
	if err != nil {
		return c.Status(409).JSON(fiber.Map{"error": "User already exists"})
	}

	go h.mailer.SendWelcome(user.Email, user.Username)

	token, _ := utils.GenerateJWT(user.ID.String(), user.Username, user.Email, h.jwtSecret, h.jwtExpiry)

	return c.Status(201).JSON(AuthResponse{
		AccessToken: token,
		ExpiresIn:   h.jwtExpiry,
		User: &models.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			TotalPoints: user.TotalPoints,
			TotalGames:  user.TotalGames,
			WinStreak:   user.WinStreak,
		},
	})
}

func (h *AuthHandlerGorm) Login(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	req.Email = utils.SanitizeInput(req.Email)

	user, err := h.authService.LoginUser(ctx, req.Email, req.Password)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token, _ := utils.GenerateJWT(user.ID.String(), user.Username, user.Email, h.jwtSecret, h.jwtExpiry)

	return c.JSON(AuthResponse{
		AccessToken: token,
		ExpiresIn:   h.jwtExpiry,
		User: &models.UserResponse{
			ID:          user.ID,
			Username:    user.Username,
			Email:       user.Email,
			TotalPoints: user.TotalPoints,
			TotalGames:  user.TotalGames,
			WinStreak:   user.WinStreak,
		},
	})
}

func (h *AuthHandlerGorm) ForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	req.Email = utils.SanitizeInput(req.Email)

	user, err := h.authService.GetUserByEmail(c.Context(), req.Email)
	if err == nil {
		token, _ := utils.GenerateResetToken()
		expiry := time.Now().Add(1 * time.Hour)
		h.authService.UpdateResetToken(c.Context(), user.ID, token, expiry)
		
		resetURL := fmt.Sprintf("https://briworld.onrender.com/reset-password?token=%s", token)
		go h.mailer.SendPasswordReset(user.Email, token, resetURL)
	}
	
	return c.Status(200).JSON(fiber.Map{
		"message": "If the email exists, a password reset link has been sent",
	})
}

func (h *AuthHandlerGorm) RefreshToken(c *fiber.Ctx) error {
	var req struct {
		AccessToken string `json:"access_token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	claims, err := utils.ValidateJWT(req.AccessToken, h.jwtSecret)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	newToken, _ := utils.GenerateJWT(claims.UserID, claims.Username, claims.Email, h.jwtSecret, h.jwtExpiry)

	return c.Status(200).JSON(fiber.Map{
		"access_token": newToken,
		"expires_in":   h.jwtExpiry,
	})
}
