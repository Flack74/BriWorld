// JSON loaders (countries, borders, silhouettes)
package game

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
)

func resolveDataFile(path string) string {
	candidates := []string{
		path,
		filepath.Join("backend", path),
	}

	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates,
			filepath.Join(exeDir, path),
			filepath.Join(exeDir, "backend", path),
		)
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}

	return path
}

func (g *GameData) LoadCountries(filepath string) error {
	data, err := os.ReadFile(resolveDataFile(filepath))
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, &g.Countries); err != nil {
		return err
	}

	return nil
}

func (g *GameData) LoadBorders(filepath string) error {
	data, err := os.ReadFile(resolveDataFile(filepath))
	if err != nil {
		log.Printf("Warning: Could not load borders data: %v", err)
		return nil
	}

	if err := json.Unmarshal(data, &g.Borders); err != nil {
		log.Printf("Warning: Could not parse borders data: %v", err)
		return nil
	}

	log.Printf("Successfully loaded %d border entries", len(g.Borders))
	return nil
}

func (g *GameData) LoadSilhouettes(filepath string) error {
	data, err := os.ReadFile(resolveDataFile(filepath))
	if err != nil {
		log.Printf("Warning: Could not load silhouettes: %v", err)
		return nil
	}

	if err := json.Unmarshal(data, &g.Silhouettes); err != nil {
		log.Printf("Warning: Could not parse silhouettes: %v", err)
		return nil
	}

	log.Printf("Loaded %d silhouettes", len(g.Silhouettes))
	return nil
}
