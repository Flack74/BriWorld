# Development stage with Air for hot reload
FROM golang:1.25-alpine AS development

RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev curl bash make

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

RUN go install github.com/air-verse/air@latest

COPY backend/ ./

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

# Frontend build stage
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Backend build stage
FROM golang:1.25-alpine AS backend-builder

RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download && go mod verify

COPY backend/cmd/ ./cmd/
COPY backend/internal/ ./internal/
COPY backend/static/ ./static/

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -trimpath \
    -tags netgo \
    -installsuffix netgo \
    -o briworld ./cmd/server

RUN chmod +x ./briworld

# Production runtime stage
FROM alpine:3.19 AS production

RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    curl \
    wget \
    bash \
    dumb-init

RUN update-ca-certificates

RUN cp /usr/share/zoneinfo/UTC /etc/localtime && \
    echo "UTC" > /etc/timezone

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=backend-builder /app/briworld ./
COPY --from=backend-builder /app/static ./static/
COPY --from=frontend-builder /frontend/dist ./web-dist
COPY frontend/Music ./Music/
COPY backend/healthcheck.sh ./

RUN mkdir -p uploads && \
    chmod +x ./briworld ./healthcheck.sh && \
    chown -R appuser:appgroup /app

USER appuser

ENV ENV=production \
    PORT=8080 \
    GIN_MODE=release \
    GOGC=100 \
    TZ=UTC \
    CGO_ENABLED=0

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD ./healthcheck.sh || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./briworld"]
