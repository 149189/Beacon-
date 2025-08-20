# companion/Dockerfile
FROM ghcr.io/cirruslabs/flutter:3.35.1

WORKDIR /app

# Copy pubspec and resolve dependencies first (better layer caching)
COPY pubspec.* ./
RUN flutter pub get

# Copy the rest of the project
COPY . .

# Expose Flutter Web server port
EXPOSE 8080

# Run Flutter Web on 0.0.0.0 so it works inside Docker
CMD ["flutter", "run", "-d", "web-server", "--web-port=8080", "--web-hostname=0.0.0.0"]
