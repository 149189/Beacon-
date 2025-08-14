# 🗄️ MySQL Setup Guide for Beacon Admin Panel

This guide will help you connect your Beacon Django backend to a MySQL database.

## 📋 Prerequisites

- ✅ MySQL Server installed and running
- ✅ Python with pip
- ✅ Beacon Django project set up

## 🔧 Step 1: Install MySQL Server

### **Windows (XAMPP/WAMP)**
1. Download and install [XAMPP](https://www.apachefriends.org/) or [WAMP](https://www.wampserver.com/)
2. Start MySQL service from the control panel
3. Default credentials: `root` with no password

### **Windows (Standalone MySQL)**
1. Download MySQL from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
2. Install with default settings
3. Set root password during installation

### **Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### **macOS**
```bash
brew install mysql
brew services start mysql
```

## 🔑 Step 2: Create Your Environment File

Create a `.env` file in `server/beacon_server/` with your MySQL credentials:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# MySQL Database Configuration
MYSQL_DB=beacon_db
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_HOST=localhost
MYSQL_PORT=3306
```

**⚠️ Important:** Replace `your_mysql_password_here` with your actual MySQL root password!

## 🚀 Step 3: Setup MySQL Database

### **Option A: Use the Setup Script (Recommended)**
```bash
cd server/beacon_server
python setup_mysql.py
```

Choose option 1 to create the database automatically.

### **Option B: Manual MySQL Setup**
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE beacon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Verify database creation
SHOW DATABASES;

# Exit MySQL
EXIT;
```

## 📦 Step 4: Install Python Dependencies

```bash
cd server/beacon_server
pip install mysqlclient python-dotenv
```

## 🔄 Step 5: Run Django Migrations

```bash
# Create database tables
python manage.py makemigrations
python manage.py migrate

# Create demo data
python manage.py setup_demo_data

# Create superuser (optional)
python manage.py createsuperuser
```

## 🧪 Step 6: Test the Connection

```bash
# Test database connection
python setup_mysql.py
```

Choose option 2 to test the connection.

## 🚨 Troubleshooting

### **Error: "Access denied for user 'root'@'localhost'"**
```bash
# Connect to MySQL as root
mysql -u root -p

# Reset root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### **Error: "Can't connect to MySQL server"**
1. Check if MySQL service is running
2. Verify port 3306 is not blocked
3. Check firewall settings

### **Error: "Unknown database 'beacon_db'"**
```bash
# Create database manually
mysql -u root -p
CREATE DATABASE beacon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### **Error: "mysqlclient not found"**
```bash
# Install MySQL client
pip install mysqlclient

# If that fails, try:
pip install --only-binary :all: mysqlclient
```

## 🔍 Verify Installation

### **Check MySQL Status**
```bash
# Windows (XAMPP)
# Check XAMPP Control Panel

# Linux/macOS
sudo systemctl status mysql
```

### **Test Django Connection**
```bash
cd server/beacon_server
python manage.py check --database default
```

### **Start Django Server**
```bash
python manage.py runserver
```

If successful, you should see:
```
Django version X.X.X, using settings 'beacon_server.settings'
Starting development server at http://127.0.0.1:8000/
```

## 📊 Database Schema

After running migrations, your MySQL database will contain:

- **auth_user** - Django user accounts
- **beacon_auth_userprofile** - Extended user profiles
- **beacon_auth_message** - Support messages and feedback
- **beacon_auth_useractivity** - User activity logs
- **beacon_auth_systemnotification** - System notifications

## 🎯 Next Steps

1. **Start Django Server**: `python manage.py runserver`
2. **Access Admin**: http://localhost:8000/admin
3. **Login**: Use admin credentials from demo data
4. **Start Frontend**: Navigate to `admin_client/beacon_user` and run `npm run dev`

## 🔒 Security Notes

- **Never commit** your `.env` file to version control
- **Use strong passwords** for MySQL root user
- **Limit database access** to only necessary users
- **Regular backups** of your MySQL database

## 📞 Support

If you encounter issues:

1. Check the Django error logs in `logs/django.log`
2. Verify MySQL connection with `python setup_mysql.py`
3. Check MySQL error logs
4. Ensure all environment variables are set correctly

---

**🎉 Congratulations! Your Beacon admin panel is now connected to MySQL!**
