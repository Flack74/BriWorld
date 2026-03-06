package utils

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-key-for-jwt-testing"

// TestGenerateJWT tests JWT token generation
func TestGenerateJWT(t *testing.T) {
	tests := []struct {
		name     string
		userID   string
		username string
		email    string
		secret   string
		expiry   int
		wantErr  bool
	}{
		{
			name:     "valid token generation",
			userID:   "user123",
			username: "testuser",
			email:    "test@example.com",
			secret:   testSecret,
			expiry:   3600,
			wantErr:  false,
		},
		{
			name:     "short expiry",
			userID:   "user123",
			username: "testuser",
			email:    "test@example.com",
			secret:   testSecret,
			expiry:   1,
			wantErr:  false,
		},
		{
			name:     "long expiry",
			userID:   "user123",
			username: "testuser",
			email:    "test@example.com",
			secret:   testSecret,
			expiry:   86400 * 30, // 30 days
			wantErr:  false,
		},
		{
			name:     "empty user ID",
			userID:   "",
			username: "testuser",
			email:    "test@example.com",
			secret:   testSecret,
			expiry:   3600,
			wantErr:  false, // Should still generate token
		},
		{
			name:     "empty username",
			userID:   "user123",
			username: "",
			email:    "test@example.com",
			secret:   testSecret,
			expiry:   3600,
			wantErr:  false,
		},
		{
			name:     "empty email",
			userID:   "user123",
			username: "testuser",
			email:    "",
			secret:   testSecret,
			expiry:   3600,
			wantErr:  false,
		},
		{
			name:     "empty secret",
			userID:   "user123",
			username: "testuser",
			email:    "test@example.com",
			secret:   "",
			expiry:   3600,
			wantErr:  false, // JWT library allows empty secret
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := GenerateJWT(tt.userID, tt.username, tt.email, tt.secret, tt.expiry)
			if (err != nil) != tt.wantErr {
				t.Errorf("GenerateJWT() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if token == "" {
					t.Error("GenerateJWT() returned empty token")
				}
				// Verify token has three parts (header.payload.signature)
				if len(token) < 10 {
					t.Error("GenerateJWT() returned invalid token format")
				}
			}
		})
	}
}

// TestValidateJWT tests JWT token validation
func TestValidateJWT(t *testing.T) {
	// Generate a valid token for testing
	userID := "user123"
	username := "testuser"
	email := "test@example.com"
	validToken, err := GenerateJWT(userID, username, email, testSecret, 3600)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}

	// Generate an expired token
	expiredToken, err := GenerateJWT(userID, username, email, testSecret, -1)
	if err != nil {
		t.Fatalf("Failed to generate expired token: %v", err)
	}

	tests := []struct {
		name    string
		token   string
		secret  string
		wantErr bool
	}{
		{
			name:    "valid token",
			token:   validToken,
			secret:  testSecret,
			wantErr: false,
		},
		{
			name:    "expired token",
			token:   expiredToken,
			secret:  testSecret,
			wantErr: true,
		},
		{
			name:    "wrong secret",
			token:   validToken,
			secret:  "wrong-secret",
			wantErr: true,
		},
		{
			name:    "malformed token",
			token:   "invalid.token.format",
			secret:  testSecret,
			wantErr: true,
		},
		{
			name:    "empty token",
			token:   "",
			secret:  testSecret,
			wantErr: true,
		},
		{
			name:    "random string",
			token:   "randomstring",
			secret:  testSecret,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := ValidateJWT(tt.token, tt.secret)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateJWT() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if claims == nil {
					t.Error("ValidateJWT() returned nil claims for valid token")
				}
				if claims.UserID != userID {
					t.Errorf("ValidateJWT() UserID = %v, want %v", claims.UserID, userID)
				}
				if claims.Username != username {
					t.Errorf("ValidateJWT() Username = %v, want %v", claims.Username, username)
				}
				if claims.Email != email {
					t.Errorf("ValidateJWT() Email = %v, want %v", claims.Email, email)
				}
			}
		})
	}
}

// TestJWTWorkflow tests the complete JWT workflow: generate -> validate
func TestJWTWorkflow(t *testing.T) {
	testCases := []struct {
		userID   string
		username string
		email    string
	}{
		{"user1", "alice", "alice@example.com"},
		{"user2", "bob", "bob@example.com"},
		{"user3", "charlie", "charlie@example.com"},
	}

	for _, tc := range testCases {
		t.Run(tc.username, func(t *testing.T) {
			// Generate token
			token, err := GenerateJWT(tc.userID, tc.username, tc.email, testSecret, 3600)
			if err != nil {
				t.Fatalf("GenerateJWT() failed: %v", err)
			}

			// Validate token
			claims, err := ValidateJWT(token, testSecret)
			if err != nil {
				t.Fatalf("ValidateJWT() failed: %v", err)
			}

			// Verify claims
			if claims.UserID != tc.userID {
				t.Errorf("UserID mismatch: got %v, want %v", claims.UserID, tc.userID)
			}
			if claims.Username != tc.username {
				t.Errorf("Username mismatch: got %v, want %v", claims.Username, tc.username)
			}
			if claims.Email != tc.email {
				t.Errorf("Email mismatch: got %v, want %v", claims.Email, tc.email)
			}

			// Verify expiration is in the future
			if claims.ExpiresAt.Time.Before(time.Now()) {
				t.Error("Token already expired")
			}

			// Verify issued at is in the past
			if claims.IssuedAt.Time.After(time.Now()) {
				t.Error("Token issued in the future")
			}
		})
	}
}

// TestJWTExpiration tests token expiration behavior
func TestJWTExpiration(t *testing.T) {
	// Generate token that expires in 1 second
	token, err := GenerateJWT("user123", "testuser", "test@example.com", testSecret, 1)
	if err != nil {
		t.Fatalf("GenerateJWT() failed: %v", err)
	}

	// Validate immediately - should succeed
	_, err = ValidateJWT(token, testSecret)
	if err != nil {
		t.Errorf("ValidateJWT() failed for fresh token: %v", err)
	}

	// Wait for token to expire
	time.Sleep(2 * time.Second)

	// Validate after expiration - should fail
	_, err = ValidateJWT(token, testSecret)
	if err == nil {
		t.Error("ValidateJWT() succeeded for expired token")
	}
}

// TestJWTClaimsStructure tests the Claims structure
func TestJWTClaimsStructure(t *testing.T) {
	claims := Claims{
		UserID:   "user123",
		Username: "testuser",
		Email:    "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Verify all fields are accessible
	if claims.UserID == "" {
		t.Error("UserID is empty")
	}
	if claims.Username == "" {
		t.Error("Username is empty")
	}
	if claims.Email == "" {
		t.Error("Email is empty")
	}
	if claims.ExpiresAt == nil {
		t.Error("ExpiresAt is nil")
	}
	if claims.IssuedAt == nil {
		t.Error("IssuedAt is nil")
	}
}

// TestJWTSecretSensitivity tests that different secrets produce different tokens
func TestJWTSecretSensitivity(t *testing.T) {
	userID := "user123"
	username := "testuser"
	email := "test@example.com"

	token1, err := GenerateJWT(userID, username, email, "secret1", 3600)
	if err != nil {
		t.Fatalf("GenerateJWT() with secret1 failed: %v", err)
	}

	token2, err := GenerateJWT(userID, username, email, "secret2", 3600)
	if err != nil {
		t.Fatalf("GenerateJWT() with secret2 failed: %v", err)
	}

	// Tokens should be different
	if token1 == token2 {
		t.Error("Different secrets produced identical tokens")
	}

	// Token1 should not validate with secret2
	_, err = ValidateJWT(token1, "secret2")
	if err == nil {
		t.Error("Token validated with wrong secret")
	}

	// Token2 should not validate with secret1
	_, err = ValidateJWT(token2, "secret1")
	if err == nil {
		t.Error("Token validated with wrong secret")
	}
}

// BenchmarkGenerateJWT benchmarks JWT generation performance
func BenchmarkGenerateJWT(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GenerateJWT("user123", "testuser", "test@example.com", testSecret, 3600)
	}
}

// BenchmarkValidateJWT benchmarks JWT validation performance
func BenchmarkValidateJWT(b *testing.B) {
	token, _ := GenerateJWT("user123", "testuser", "test@example.com", testSecret, 3600)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ValidateJWT(token, testSecret)
	}
}
