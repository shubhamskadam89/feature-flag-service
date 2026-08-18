# Stage 1: Build Spring Boot JAR
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Cache Maven dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -Dprettier.skip=true -B || true

# Copy source code and build optimized production JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -Dprettier.skip=true -B

# Stage 2: Lightweight JRE 21 Runtime
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
