// orchestrates loading
package game

import (
	"math/rand"
	"time"
)

func LoadStaticData() error {
	if err := Data.LoadCountries("static/world.json"); err != nil {
		return err
	}

	if err := Data.LoadBorders("static/borders.json"); err != nil {
		return err
	}

	if err := Data.LoadSilhouettes("static/silhouettes.json"); err != nil {
		return err
	}

	buildIndexes()         // countryKeys + countryNameIndex
	buildISOReverseIndex() // iso3 → iso2 map
	Data.Rng = rand.New(rand.NewSource(time.Now().UnixNano()))

	return nil
}
