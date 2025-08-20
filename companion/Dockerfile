# companion/Dockerfile
FROM ubuntu:22.04

WORKDIR /app

# Install Flutter and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git /flutter
ENV PATH="/flutter/bin:${PATH}"

# Pre-download Flutter artifacts
RUN flutter precache

# Copy pubspec and resolve dependencies first (better layer caching)
COPY pubspec.* ./
RUN flutter pub get

# Copy the rest of the project
COPY . .

# Expose Flutter Web server port
EXPOSE 8080

# Run Flutter Web on 0.0.0.0 so it works inside Docker
CMD ["flutter", "run", "-d", "web-server", "--web-port=8080", "--web-hostname=0.0.0.0"]
