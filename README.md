# 🚀 Beacon Full-Stack Application

A modern full-stack web application built with React.js frontend, Django backend, and MySQL database, all containerized with Docker.

## 🏗️ Architecture

- **Frontend**: React.js with modern UI/UX
- **Backend**: Django REST API with MySQL database
- **Database**: MySQL 8.0
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
Beacon--1/
├── frontend/                 # React.js Frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── backend/                  # Django Backend
│   ├── beacon_backend/      # Django project
│   ├── api/                 # API app
│   ├── requirements.txt
│   ├── manage.py
│   └── Dockerfile
├── mysql/                   # Database initialization
│   └── init.sql
├── docker-compose.yml       # Docker orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker
- Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd Beacon--1
```

### 2. Environment Configuration

Copy the example environment file and configure your database settings:

```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` with your MySQL credentials:
```env
MYSQL_DB=beacon_db
MYSQL_USER=root
MYSQL_PASSWORD=Kaustubh@149
MYSQL_HOST=db
MYSQL_PORT=3306
```

### 3. Start the Application

```bash
docker-compose up --build
```

This will start all services:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: localhost:3306

### 4. Access the Application

- **Frontend**: Open http://localhost:3000 in your browser
- **Backend API**: http://localhost:8000/api/health/
- **Django Admin**: http://localhost:8000/admin/

## 🛠️ Development

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Database Management

```bash
# Access MySQL container
docker exec -it beacon_mysql mysql -u root -p

# Run Django migrations
docker exec -it beacon_backend python manage.py migrate

# Create superuser
docker exec -it beacon_backend python manage.py createsuperuser
```

## 🔧 Configuration

### Database Configuration

The application uses MySQL with the following default settings:
- **Database**: `beacon_db`
- **User**: `root`
- **Password**: `Kaustubh@149`
- **Host**: `db` (Docker service name)
- **Port**: `3306`

### CORS Settings

CORS is configured to allow all origins for development. Update `backend/beacon_backend/settings.py` for production.

## 📊 API Endpoints

### Health Check
- **GET** `/api/health/` - Backend and database status

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (database data)
docker-compose down -v

# Rebuild specific service
docker-compose build backend
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**: Ensure ports 3000, 8000, and 3306 are available
2. **Database connection failed**: Wait for MySQL to fully start (may take 30-60 seconds)
3. **Frontend not loading**: Check if backend is running and accessible

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## 🚀 Production Deployment

For production deployment:

1. Update `SECRET_KEY` in Django settings
2. Set `DEBUG = False`
3. Configure proper CORS settings
4. Use environment variables for sensitive data
5. Set up proper SSL/TLS certificates
6. Configure database backups

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository.

