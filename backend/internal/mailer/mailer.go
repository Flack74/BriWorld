package mailer

import (
	"fmt"
	"log"
	"net/smtp"
)

type Mailer struct {
	host     string
	port     int
	username string
	password string
}

func New(host string, port int, username, password string) *Mailer {
	return &Mailer{
		host:     host,
		port:     port,
		username: username,
		password: password,
	}
}

func (m *Mailer) SendPasswordReset(to, token, resetURL string) error {
	subject := "Reset Your BriWorld Password"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { color: #333; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">Password Reset Request</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your BriWorld password. Click the button below to proceed:</p>
        <a href="%s" class="button">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
            <p>BriWorld - Real-Time Multiplayer Geography Quiz Game</p>
            <p>© 2026 BriWorld. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, resetURL)

	return m.sendHTML(to, subject, body)
}

func (m *Mailer) SendWelcome(to, username string) error {
	subject := "Welcome to BriWorld!"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { color: #333; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">Welcome to BriWorld, %s!</h2>
        <p>Your account has been successfully created.</p>
        <p>Get ready to test your geography knowledge and compete with players worldwide!</p>
        <a href="https://briworld.onrender.com" class="button">Start Playing</a>
        <div class="footer">
            <p>BriWorld - Real-Time Multiplayer Geography Quiz Game</p>
            <p>© 2026 BriWorld. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, username)

	return m.sendHTML(to, subject, body)
}

func (m *Mailer) SendGameInvite(to, inviterName, roomCode string) error {
	subject := fmt.Sprintf("%s invited you to play BriWorld!", inviterName)
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { color: #333; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">You're Invited!</h2>
        <p>%s invited you to play BriWorld!</p>
        <p>Room Code: <strong>%s</strong></p>
        <a href="https://briworld.onrender.com?room=%s" class="button">Join Game</a>
        <div class="footer">
            <p>BriWorld - Real-Time Multiplayer Geography Quiz Game</p>
            <p>© 2026 BriWorld. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, inviterName, roomCode, roomCode)

	return m.sendHTML(to, subject, body)
}

func (m *Mailer) SendLeaderboardNotification(to, username string, rank int, points int) error {
	subject := "You're on the BriWorld Leaderboard!"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { color: #333; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="header">🏆 Congratulations!</h2>
        <p>Hi %s,</p>
        <p>You've made it to the BriWorld leaderboard!</p>
        <p><strong>Rank:</strong> #%d</p>
        <p><strong>Points:</strong> %d</p>
        <a href="https://briworld.onrender.com/leaderboard" class="button">View Leaderboard</a>
        <div class="footer">
            <p>BriWorld - Real-Time Multiplayer Geography Quiz Game</p>
            <p>© 2026 BriWorld. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
	`, username, rank, points)

	return m.sendHTML(to, subject, body)
}

func (m *Mailer) sendHTML(to, subject, htmlBody string) error {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[MAILER] Panic sending email to %s: %v", to, r)
		}
	}()

	auth := smtp.PlainAuth("", m.username, m.password, m.host)

	headers := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n",
		m.username, to, subject,
	)

	msg := headers + htmlBody

	addr := fmt.Sprintf("%s:%d", m.host, m.port)
	err := smtp.SendMail(addr, auth, m.username, []string{to}, []byte(msg))
	if err != nil {
		log.Printf("[MAILER] Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("[MAILER] Email sent successfully to %s", to)
	return nil
}

// SendPlainText sends a plain text email (fallback)
func (m *Mailer) SendPlainText(to, subject, body string) error {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[MAILER] Panic sending email to %s: %v", to, r)
		}
	}()

	auth := smtp.PlainAuth("", m.username, m.password, m.host)

	headers := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n",
		m.username, to, subject,
	)

	msg := headers + body

	addr := fmt.Sprintf("%s:%d", m.host, m.port)
	err := smtp.SendMail(addr, auth, m.username, []string{to}, []byte(msg))
	if err != nil {
		log.Printf("[MAILER] Failed to send email to %s: %v", to, err)
		return err
	}

	log.Printf("[MAILER] Email sent successfully to %s", to)
	return nil
}
