package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	Pool *pgxpool.Pool
}

func New(dsn string) (*Database, error) {
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("✓ Database connected")
	return &Database{Pool: pool}, nil
}

func (db *Database) RunMigrations(migrationsDir string) error {
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return err
	}

	sort.Strings(files)

	for _, file := range files {
		if err := db.runMigration(file); err != nil {
			return err
		}
	}

	log.Println("✓ All migrations applied")
	return nil
}

func (db *Database) runMigration(filepath string) error {
	content, err := os.ReadFile(filepath)
	if err != nil {
		return err
	}

	ctx := context.Background()
	if _, err := db.Pool.Exec(ctx, string(content)); err != nil {
		return fmt.Errorf("migration %s failed: %w", filepath, err)
	}

	log.Printf("✓ Applied: %s\n", filepath)
	return nil
}

func (db *Database) Close() {
	db.Pool.Close()
}
