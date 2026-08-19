# ── Build stage ──────────────────────────────────────────
FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Copy POM and resolve dependencies (layer cache)
COPY pom.xml .
RUN mvn dependency:resolve -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Runtime stage ────────────────────────────────────────
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Download Supabase/ISRG Root X2 cert for PostgreSQL SSL
RUN apk add --no-cache curl ca-certificates && \
    curl -sL https://letsencrypt.org/certs/isrgrootx2.pem -o /tmp/root.crt && \
    apk del curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown appuser:appgroup /tmp/root.crt
USER appuser

COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
