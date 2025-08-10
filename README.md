# 🌐 Beacon — Your Signal for Safety

**Beacon** is a mobile-first personal safety platform designed to deliver rapid emergency alerts, live location tracking, and secure evidence sharing — all coordinated through a real-time operator console.

---

## 🚨 The Problem
In moments of danger, every second counts — yet:
- Calling for help can be delayed if a phone is locked or network is weak.
- Victims may not be able to speak or clearly describe their location.
- Emergency services often lack timely, precise information to respond effectively.
- There's no standard workflow for how operators handle panic events, leading to delays or miscommunication.

---

## ✅ The Solution — Beacon
Beacon empowers individuals to **send an emergency signal instantly** and gives operators **real-time situational awareness** to respond faster.

**Core Features (MVP)**
- **Panic Triggers:** One-tap panic button, shake-to-alert, decoy screen.
- **Background GPS:** Continuous location sharing with offline buffering.
- **Media Capture:** One-touch audio/video snippet recording (uploads when online).
- **Operator Console:** Live incident map, two-way chat/voice, SOP templates, incident logging.
- **Consent & Privacy:** User-driven data retention policies and encrypted uploads.

---

## 🛠️ Tech Stack
**Frontend (Mobile)** — React Native (cross-platform)  
**Backend API** — Django REST Framework + Django Channels (WebSockets)  
**Operator Console** — React.js Web App  
**Database** — MySQL  
**Real-time Communication** — Redis + WebSockets  
**Cloud Storage** — AWS S3 / GCP Storage (Signed URLs)  
**Auth** — JWT / Token-based authentication  
**Monitoring** — Sentry for crash/error reporting

---

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ and npm
- Python 3.8+
- MySQL 8.0+

### 1. Clone and Setup
```bash
git clone https://github.com/149189/Beacon-.git
cd Beacon-
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
# Backend Configuration
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
```

### 3. Database Setup
```bash
# Start MySQL (if not running)
docker run -d --name beacon-mysql \
  -e MYSQL_ROOT_PASSWORD=Kaustubh@149 \
  -e MYSQL_DATABASE=beacon_db \
  -p 3306:3306 \
  mysql:8.0

# Wait for MySQL to be ready, then run migrations
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Build and Run with Docker
```bash
# Build the images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 5. Access the Application
- **Operator Console:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **Admin Panel:** http://localhost:8001/admin
- **Health Check:** http://localhost:8001/api/health/

---

## 📍 Project Workflow

**1. User Side (Mobile App)**
- User triggers alert via panic button, shake, or decoy screen.
- App captures GPS + optional audio/video snippet.
- If offline, stores data locally and uploads when connected.

**2. Backend**
- Receives alert and stores securely with timestamps, location, and media links.
- Pushes event to operator console in real-time via WebSockets.
- Applies consent-based retention rules.

**3. Operator Console**
- Displays active events on a live map.
- Enables two-way chat or push-to-talk with user.
- Logs actions taken and applies predefined SOP templates.
- Marks incident as resolved when closed.

---

## 🗺️ Roadmap

**MVP (v0.1 — Demand Validation)** ✅
- [ ] Mobile panic triggers & location streaming
- [ ] Operator console with live incident map
- [ ] Offline buffering & sync
- [ ] Basic SOP templates

**Intermediate (v0.2 — Operational Rollout)**
- [ ] Role-based operator accounts
- [ ] Voice call integration
- [ ] Automated nearest-responders dispatch
- [ ] Data retention dashboard

**Advanced (v0.3 — Intelligence Layer)**
- [ ] AI-driven threat classification (audio/video analysis)
- [ ] Predictive location tracking during movement
- [ ] Integration with police dispatch systems

**Super-Advanced (Future)**
- [ ] Drone-based first responder support
- [ ] Wearable integration (smartwatch panic trigger)
- [ ] Crowd-sourced live safety monitoring

---

## 🧪 Development & Testing

### Create Test Data
```bash
cd backend
python create_test_incident.py
```

### Run Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

### Development Mode
```bash
# Backend (with auto-reload)
cd backend
python manage.py runserver

# Frontend (with hot reload)
cd frontend
npm start
```

---

## 🔒 Privacy & Security
- All data encrypted in transit (TLS) and at rest.
- Signed URLs for time-limited media access.
- User-controlled data retention settings.
- Audit logs for all access to sensitive information.

---

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Ensure Redis is running: `docker-compose ps redis`
- Check backend logs: `docker-compose logs backend`

**Database Connection Error**
- Verify MySQL is running and accessible
- Check environment variables in docker-compose.yml

**Frontend Not Loading**
- Check if backend is running on port 8001
- Verify CORS settings in backend/settings.py

**Map Not Displaying**
- Set `REACT_APP_MAPBOX_TOKEN` in your environment
- Get a free token from [Mapbox](https://www.mapbox.com/)

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs redis
```

---

## 🤝 Contributing
We welcome contributions from developers, designers, and security experts.

### Development Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📜 License
Licensed under the [MIT License](LICENSE).

---

## 📦 Repository Structure

```
Beacon-/
├── backend/                 # Django backend API
│   ├── api/                # Core API endpoints
│   ├── operator_console/   # Operator console app
│   ├── beacon_backend/     # Django project settings
│   └── requirements.txt    # Python dependencies
├── frontend/               # React operator console
│   ├── src/
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utilities (WebSocket, etc.)
│   └── package.json       # Node.js dependencies
├── mysql/                  # Database initialization
├── docker-compose.yml      # Docker orchestration
└── README.md              # This file
```

---

> *Beacon — Your signal for safety, anytime, anywhere.*

