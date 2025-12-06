package handlers

import (
	"briworld/internal/models"
	"briworld/internal/services"
	"briworld/internal/utils"
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
	smtpHost    string
	smtpPort    int
	smtpUser    string
	smtpPass    string
	smtpFrom    string
}

func NewAuthHandlerGorm(authService *services.AuthServiceGorm, jwtSecret string, jwtExpiry int, smtpHost string, smtpPort int, smtpUser, smtpPass, smtpFrom string) *AuthHandlerGorm {
	return &AuthHandlerGorm{
		authService: authService,
		jwtSecret:   jwtSecret,
		jwtExpiry:   jwtExpiry,
		smtpHost:    smtpHost,
		smtpPort:    smtpPort,
		smtpUser:    smtpUser,
		smtpPass:    smtpPass,
		smtpFrom:    smtpFrom,
	}
}

func (h *AuthHandlerGorm) Register(c *fiber.Ctx) error {
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

	user, err := h.authService.RegisterUser(c.Context(), req.Username, req.Email, passwordHash)
	if err != nil {
		return c.Status(409).JSON(fiber.Map{"error": "User already exists"})
	}

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
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	req.Email = utils.SanitizeInput(req.Email)

	user, err := h.authService.LoginUser(c.Context(), req.Email, req.Password)
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
		
		resetURL := fmt.Sprintf("http://localhost:8085/reset-password?token=%s", token)
		body := fmt.Sprintf("Click here to reset your password: %s\n\nThis link expires in 1 hour.", resetURL)
		utils.SendEmail(req.Email, "Password Reset - BriWorld", body, h.smtpHost, h.smtpPort, h.smtpUser, h.smtpPass, h.smtpFrom)
	}
	
	return c.JSON(fiber.Map{
		"message": "If the email exists, a password reset link has been sent",
	})
}
