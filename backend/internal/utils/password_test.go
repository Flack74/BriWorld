package utils

import (
	"strings"
	"testing"
)

// TestHashPassword tests password hashing functionality
func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "valid password",
			password: "SecurePass123!",
			wantErr:  false,
		},
		{
			name:     "short password",
			password: "pass",
			wantErr:  false, // Hashing should work, validation is separate
		},
		{
			name:     "long password",
			password: strings.Repeat("a", 72), // bcrypt max is 72 bytes
			wantErr:  false,
		},
		{
			name:     "too long password",
			password: strings.Repeat("a", 100),
			wantErr:  true, // bcrypt will error on >72 bytes
		},
		{
			name:     "empty password",
			password: "",
			wantErr:  false, // bcrypt can hash empty strings
		},
		{
			name:     "special characters",
			password: "P@ssw0rd!#$%",
			wantErr:  false,
		},
		{
			name:     "unicode characters",
			password: "пароль123",
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashPassword() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				// Verify hash is not empty
				if hash == "" {
					t.Error("HashPassword() returned empty hash")
				}
				// Verify hash is different from password
				if hash == tt.password {
					t.Error("HashPassword() returned unhashed password")
				}
				// Verify hash starts with bcrypt prefix
				if !strings.HasPrefix(hash, "$2a$") && !strings.HasPrefix(hash, "$2b$") {
					t.Errorf("HashPassword() returned invalid bcrypt hash: %s", hash)
				}
			}
		})
	}
}

// TestVerifyPassword tests password verification against hashed passwords
func TestVerifyPassword(t *testing.T) {
	// Pre-hash a known password for testing
	testPassword := "TestPassword123!"
	hash, err := HashPassword(testPassword)
	if err != nil {
		t.Fatalf("Failed to hash test password: %v", err)
	}

	tests := []struct {
		name     string
		hash     string
		password string
		want     bool
	}{
		{
			name:     "correct password",
			hash:     hash,
			password: testPassword,
			want:     true,
		},
		{
			name:     "incorrect password",
			hash:     hash,
			password: "WrongPassword",
			want:     false,
		},
		{
			name:     "empty password",
			hash:     hash,
			password: "",
			want:     false,
		},
		{
			name:     "case sensitive",
			hash:     hash,
			password: strings.ToLower(testPassword),
			want:     false,
		},
		{
			name:     "invalid hash format",
			hash:     "invalid_hash",
			password: testPassword,
			want:     false,
		},
		{
			name:     "empty hash",
			hash:     "",
			password: testPassword,
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := VerifyPassword(tt.hash, tt.password)
			if got != tt.want {
				t.Errorf("VerifyPassword() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestHashPasswordConsistency verifies that hashing the same password twice produces different hashes
// This is important for security - bcrypt uses random salts
func TestHashPasswordConsistency(t *testing.T) {
	password := "TestPassword123!"
	
	hash1, err1 := HashPassword(password)
	if err1 != nil {
		t.Fatalf("First hash failed: %v", err1)
	}
	
	hash2, err2 := HashPassword(password)
	if err2 != nil {
		t.Fatalf("Second hash failed: %v", err2)
	}
	
	// Hashes should be different (different salts)
	if hash1 == hash2 {
		t.Error("HashPassword() produced identical hashes for same password - salt not working")
	}
	
	// But both should verify correctly
	if !VerifyPassword(hash1, password) {
		t.Error("First hash doesn't verify")
	}
	if !VerifyPassword(hash2, password) {
		t.Error("Second hash doesn't verify")
	}
}

// TestValidatePasswordStrength tests password strength validation rules
func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{
			name:     "valid strong password",
			password: "SecurePass123!",
			want:     true,
		},
		{
			name:     "minimum valid password",
			password: "Pass123!",
			want:     true,
		},
		{
			name:     "too short",
			password: "Pass1!",
			want:     false,
		},
		{
			name:     "no uppercase",
			password: "password123!",
			want:     false,
		},
		{
			name:     "no digit",
			password: "Password!",
			want:     false,
		},
		{
			name:     "no special character",
			password: "Password123",
			want:     false,
		},
		{
			name:     "only lowercase",
			password: "password",
			want:     false,
		},
		{
			name:     "only uppercase",
			password: "PASSWORD",
			want:     false,
		},
		{
			name:     "only digits",
			password: "12345678",
			want:     false,
		},
		{
			name:     "empty password",
			password: "",
			want:     false,
		},
		{
			name:     "exactly 8 characters valid",
			password: "Pass123!",
			want:     true,
		},
		{
			name:     "long valid password",
			password: "VerySecurePassword123!@#",
			want:     true,
		},
		{
			name:     "multiple special characters",
			password: "Pass123!@#$%",
			want:     true,
		},
		{
			name:     "space as special character",
			password: "Pass 123",
			want:     true,
		},
		{
			name:     "unicode characters",
			password: "Пароль123!",
			want:     false, // Cyrillic uppercase doesn't match ASCII uppercase check
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidatePasswordStrength(tt.password)
			if got != tt.want {
				t.Errorf("ValidatePasswordStrength(%q) = %v, want %v", tt.password, got, tt.want)
			}
		})
	}
}

// TestPasswordWorkflow tests the complete password workflow: hash -> verify
func TestPasswordWorkflow(t *testing.T) {
	passwords := []string{
		"ValidPass123!",
		"AnotherSecure456@",
		"Complex#Pass789",
	}

	for _, password := range passwords {
		t.Run(password, func(t *testing.T) {
			// Hash the password
			hash, err := HashPassword(password)
			if err != nil {
				t.Fatalf("HashPassword() failed: %v", err)
			}

			// Verify correct password
			if !VerifyPassword(hash, password) {
				t.Error("VerifyPassword() failed for correct password")
			}

			// Verify incorrect password fails
			if VerifyPassword(hash, password+"wrong") {
				t.Error("VerifyPassword() succeeded for incorrect password")
			}
		})
	}
}

// BenchmarkHashPassword benchmarks password hashing performance
func BenchmarkHashPassword(b *testing.B) {
	password := "TestPassword123!"
	for i := 0; i < b.N; i++ {
		HashPassword(password)
	}
}

// BenchmarkVerifyPassword benchmarks password verification performance
func BenchmarkVerifyPassword(b *testing.B) {
	password := "TestPassword123!"
	hash, _ := HashPassword(password)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		VerifyPassword(hash, password)
	}
}

// BenchmarkValidatePasswordStrength benchmarks password strength validation
func BenchmarkValidatePasswordStrength(b *testing.B) {
	password := "TestPassword123!"
	for i := 0; i < b.N; i++ {
		ValidatePasswordStrength(password)
	}
}
