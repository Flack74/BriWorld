.PHONY: help dev build build-frontend build-all run run-all test docker-up docker-down docker-build migrate clean

help:
	@echo "BriWorld - Available commands:"
	@echo "  make dev              - Run with hot reload (Air)"
	@echo "  make build            - Build Go production binary"
	@echo "  make build-frontend   - Build React frontend"
	@echo "  make build-all        - Build both frontend and backend"
	@echo "  make run              - Run Go production binary"
	@echo "  make run-all          - Build all and run"
	@echo "  make test             - Run tests"
	@echo "  make docker-up        - Start Docker services"
	@echo "  make docker-down      - Stop Docker services"
	@echo "  make docker-build     - Build production Docker image with frontend"
	@echo "  make migrate          - Run database migrations"
	@echo "  make clean            - Clean build artifacts"

dev:
	air -c .air.toml

build:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/briworld ./cmd/server

build-frontend:
	./build-frontend.sh

build-all: build-frontend build

run:
	./bin/briworld

run-all: build-all
	./bin/briworld

test:
	go test -v ./...

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build-dev:
	docker-compose build app

docker-build:
	docker build --target production -t briworld:latest .

docker-build-prod:
	docker build --target production -t briworld:latest .

migrate:
	go run cmd/server/main.go

clean:
	rm -rf tmp/ bin/ web-dist/
	go clean

install-deps:
	go mod download
	go install github.com/cosmtrek/air@latest
