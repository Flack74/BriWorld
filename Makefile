.PHONY: help dev build run test docker-up docker-down migrate clean

help:
	@echo "BriWorld - Available commands:"
	@echo "  make dev          - Run with hot reload (Air)"
	@echo "  make build        - Build production binary"
	@echo "  make run          - Run production binary"
	@echo "  make test         - Run tests"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make migrate      - Run database migrations"
	@echo "  make clean        - Clean build artifacts"

dev:
	air -c .air.toml

build:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/briworld ./cmd/server

run:
	./bin/briworld

test:
	go test -v ./...

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build-dev:
	docker-compose build app

docker-build-prod:
	docker build --target production -t briworld:latest .

migrate:
	go run cmd/server/main.go

clean:
	rm -rf tmp/ bin/
	go clean

install-deps:
	go mod download
	go install github.com/cosmtrek/air@latest
