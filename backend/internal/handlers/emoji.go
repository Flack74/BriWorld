package handlers

import (
	"briworld/internal/game"
	"briworld/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type EmojiClue struct {
	Country string   `json:"country"`
	Code    string   `json:"code"`
	Emojis  []string `json:"emojis"`
}

func GetEmojiCluesHandler(c *fiber.Ctx) error {
	var clues []EmojiClue

	for code, emojiStr := range game.EmojiMap {

		name := game.Data.CountryNameIndex[code]

		clues = append(clues, EmojiClue{
			Country: name,
			Code:    code,
			Emojis:  utils.SplitEmojis(emojiStr),
		})
	}

	return c.JSON(clues)
}
