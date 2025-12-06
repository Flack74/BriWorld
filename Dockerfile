# Multi-stage production build with all dependencies
FROM golang:1.25-alpine AS builder

# Install all build dependencies
RUN apk add --no-cache \
    git \
    ca-certificates \
    tzdata \
    gcc \
    musl-dev \
    curl \
    wget \
    bash \
    make

WORKDIR /app

# Copy Go modules first for better caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy all source code and assets
COPY . .

# Verify all required files exist
RUN ls -la && \
    ls -la static/ && \
    ls -la web/ && \
    ls -la cmd/server/

# Build optimized production binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -trimpath \
    -tags netgo \
    -installsuffix netgo \
    -o briworld ./cmd/server

# Verify binary
RUN ls -la briworld && file briworld

# Production stage with runtime dependencies
FROM alpine:3.19 AS production

# Install runtime dependencies for full functionality
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    curl \
    wget \
    bash \
    dumb-init

# Update CA certificates
RUN update-ca-certificates

# Set timezone
RUN cp /usr/share/zoneinfo/UTC /etc/localtime && \
    echo "UTC" > /etc/timezone

# Create app user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy binary and all application files
COPY --from=builder /app/briworld ./
COPY --from=builder --chown=appuser:appgroup /app/static ./static/
COPY --from=builder --chown=appuser:appgroup /app/web ./web/

# Copy health check script
COPY --chown=appuser:appgroup healthcheck.sh ./
RUN chmod +x ./briworld ./healthcheck.sh

# Verify all files are copied correctly
RUN ls -la && \
    ls -la static/ && \
    ls -la web/ && \
    echo "Files verification complete"

# Set proper ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Production environment variables
ENV ENV=production \
    PORT=8080 \
    GIN_MODE=release \
    GOGC=100 \
    TZ=UTC \
    CGO_ENABLED=0

EXPOSE 8080

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD ./healthcheck.sh || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./briworld"]
