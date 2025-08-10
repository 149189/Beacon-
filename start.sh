#!/bin/bash

# Beacon Startup Script
# This script helps you get the Beacon system up and running

echo "🚨 Starting Beacon - Your Signal for Safety"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cat > .env << EOF
# Beacon Environment Configuration
MYSQL_DB=beacon_db
MYSQL_USER=root
MYSQL_PASSWORD=Kaustubh@149
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Frontend Configuration
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_WS_URL=ws://localhost:8001/ws/

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Django Configuration
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EOF
    echo "✅ Created .env file. Please update REACT_APP_MAPBOX_TOKEN with your Mapbox token."
fi

# Check if MySQL is running
echo "🔍 Checking MySQL connection..."
if ! docker run --rm mysql:8.0 mysql -h host.docker.internal -u root -pKaustubh@149 -e "SELECT 1" > /dev/null 2>&1; then
    echo "⚠️  MySQL is not accessible. Starting MySQL container..."
    docker run -d --name beacon-mysql \
        -e MYSQL_ROOT_PASSWORD=Kaustubh@149 \
        -e MYSQL_DATABASE=beacon_db \
        -p 3306:3306 \
        mysql:8.0
    
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 30
else
    echo "✅ MySQL is accessible"
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting Beacon services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service status
echo "📊 Service Status:"
docker-compose ps

# Check if backend is responding
echo "🔍 Checking backend health..."
if curl -s http://localhost:8001/api/health/ > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend is not responding yet. Please wait a moment and check again."
fi

echo ""
echo "🎉 Beacon is starting up!"
echo ""
echo "📱 Access your application:"
echo "   • Operator Console: http://localhost:3000"
echo "   • Backend API: http://localhost:8001"
echo "   • Admin Panel: http://localhost:8001/admin"
echo ""
echo "📋 Useful commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo ""
echo "🔧 Next steps:"
echo "   1. Get a Mapbox token from https://www.mapbox.com/"
echo "   2. Update REACT_APP_MAPBOX_TOKEN in your .env file"
echo "   3. Create test incidents: cd backend && python create_test_incident.py"
echo ""
echo "Happy coding! 🚀"
