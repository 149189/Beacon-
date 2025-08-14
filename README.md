# Beacon - Full Stack Admin Panel

A comprehensive, production-ready admin panel built with **Django REST API** backend and **React + Shadcn UI** frontend.

## 🚀 Features

### Backend (Django)
- **JWT Authentication** with refresh tokens
- **User Management** with profiles and activity tracking
- **Message System** with support requests, feedback, and bug reports
- **Real-time Statistics** and dashboard metrics
- **Admin Interface** with comprehensive user management
- **API Documentation** with Swagger/OpenAPI
- **Activity Logging** for audit trails
- **System Notifications** for user communication

### Frontend (React)
- **Modern UI** built with Shadcn UI components
- **Responsive Design** for all devices
- **Real-time Dashboard** with live statistics
- **User Management** interface
- **Message Center** for support and feedback
- **Activity Monitoring** and analytics
- **Protected Routes** with authentication
- **Dark/Light Mode** support

## 🏗️ Architecture

```
Beacon/
├── server/                 # Django Backend
│   └── beacon_server/
│       ├── auth/          # Authentication & User Management
│       ├── beacon_server/ # Django Settings & URLs
│       └── manage.py      # Django Management
└── admin_client/          # React Frontend
    └── beacon_user/
        ├── src/
        │   ├── components/ # UI Components
        │   ├── pages/      # Page Components
        │   ├── services/   # API Services
        │   └── contexts/   # React Contexts
        └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API framework
- **JWT Authentication** - Secure token-based auth
- **SQLite/MySQL** - Database (configurable)
- **CORS** - Cross-origin resource sharing
- **Pillow** - Image processing

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Lucide React** - Icons

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **npm or yarn**
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Beacon
```

### 2. Backend Setup (Django)

```bash
cd server/beacon_server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser and demo data
python manage.py createsuperuser
python manage.py setup_demo_data

# Start development server
python manage.py runserver
```

**Backend will be available at:** `http://localhost:8000`
**Admin interface:** `http://localhost:8000/admin`

### 3. Frontend Setup (React)

```bash
cd admin_client/beacon_user

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will be available at:** `http://localhost:5173`

## 🔐 Authentication

### Demo Credentials
- **Admin User:**
  - Username: `admin`
  - Password: `admin123`
- **Demo Users:**
  - Username: `john_doe`, `jane_smith`, etc.
  - Password: `demo123`

### JWT Tokens
- **Access Token:** Valid for 1 hour
- **Refresh Token:** Valid for 7 days
- **Auto-refresh:** Handled automatically by frontend

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/register/` - User registration

### Users
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update profile
- `GET /api/auth/users/` - List users (admin only)

### Messages
- `GET /api/auth/messages/` - List messages
- `POST /api/auth/messages/` - Create message
- `GET /api/auth/messages/{id}/` - Get message details
- `PATCH /api/auth/messages/{id}/` - Update message
- `DELETE /api/auth/messages/{id}/` - Delete message

### Dashboard
- `GET /api/auth/dashboard/stats/` - Dashboard statistics (admin only)
- `GET /api/auth/activities/` - User activities
- `GET /api/auth/notifications/` - System notifications

## 🎨 Frontend Features

### Dashboard
- **Statistics Cards** - User counts, message metrics
- **Recent Activity** - Latest users and messages
- **Real-time Updates** - Live data from backend

### User Management
- **User List** - View all users with search/filter
- **Online Status** - Real-time user activity
- **Profile Management** - Edit user information

### Message Center
- **Message List** - View all support requests
- **Priority Management** - Handle urgent issues
- **Status Updates** - Track message progress
- **Admin Notes** - Internal communication

## 🔧 Configuration

### Environment Variables
Create a `.env` file in `server/beacon_server/`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### Database Configuration
The application uses SQLite by default for development. For production, update `settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'beacon_db',
        'USER': 'db_user',
        'PASSWORD': 'db_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

## 🚀 Deployment

### Backend (Django)
```bash
# Production settings
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com']

# Collect static files
python manage.py collectstatic

# Use production server (Gunicorn)
gunicorn beacon_server.wsgi:application
```

### Frontend (React)
```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting service
```

## 📱 Mobile Support

- **Responsive Design** - Works on all screen sizes
- **Touch-friendly** - Optimized for mobile devices
- **Progressive Web App** - Can be installed on mobile

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **CORS Protection** - Controlled cross-origin access
- **Input Validation** - Server-side data validation
- **SQL Injection Protection** - Django ORM security
- **XSS Protection** - Built-in Django security

## 🧪 Testing

### Backend Testing
```bash
cd server/beacon_server
python manage.py test
```

### Frontend Testing
```bash
cd admin_client/beacon_user
npm run test
```

## 📈 Monitoring & Analytics

- **User Activity Tracking** - Monitor user behavior
- **Performance Metrics** - Track system performance
- **Error Logging** - Capture and log errors
- **Audit Trails** - Complete activity history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check the code comments and docstrings
- **Issues:** Create an issue on GitHub
- **Discussions:** Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] **Real-time Chat** - Live chat support
- [ ] **File Management** - Document upload/download
- [ ] **Advanced Analytics** - Detailed reporting
- [ ] **Multi-language Support** - Internationalization
- [ ] **Mobile App** - Native mobile applications
- [ ] **API Rate Limiting** - Enhanced security
- [ ] **WebSocket Support** - Real-time updates
- [ ] **Advanced Search** - Full-text search capabilities

---

**Built with ❤️ using Django and React**

