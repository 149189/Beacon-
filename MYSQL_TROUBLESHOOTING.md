# MySQL Connection Troubleshooting Guide

## Current Error
```
❌ Connection failed: 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)
```

## What This Means
The MySQL connection is being attempted without a password, but your MySQL server requires authentication.

## Solutions

### 1. Check MySQL Server Status
Make sure MySQL server is running:
```bash
# Windows (if using XAMPP/WAMP)
# Check if MySQL service is running in XAMPP Control Panel

# Windows (if using MySQL Installer)
# Check Services app for "MySQL80" or similar service

# Command line check
mysql --version
```

### 2. Verify MySQL Credentials
Your `config.env` file should have:
```env
MYSQL_USER=root
MYSQL_PASSWORD=Kaustubh@149
```

**Important**: Make sure there are no spaces around the `=` sign.

### 3. Test MySQL Connection Manually
Try connecting manually to verify credentials:
```bash
mysql -u root -p
# Enter password: Kaustubh@149
```

### 4. Reset MySQL Root Password (if needed)
If you can't remember the password:

#### Option A: Using MySQL Installer
1. Open MySQL Installer
2. Choose "Reconfigure" for your MySQL instance
3. Set a new root password

#### Option B: Command Line Reset
```bash
# Stop MySQL service first
net stop MySQL80

# Start MySQL in safe mode
mysqld --skip-grant-tables

# In another terminal
mysql -u root
UPDATE mysql.user SET authentication_string=PASSWORD('new_password') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;

# Restart MySQL service
net start MySQL80
```

### 5. Create New MySQL User (Alternative)
Instead of using root, create a dedicated user:
```sql
CREATE USER 'beacon_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON beacon_db.* TO 'beacon_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `config.env`:
```env
MYSQL_USER=beacon_user
MYSQL_PASSWORD=your_password
```

### 6. Check MySQL Configuration
Verify MySQL is configured to accept local connections:
```sql
SELECT user, host FROM mysql.user WHERE user='root';
```

### 7. Common Issues and Fixes

#### Issue: "Access denied for user 'root'@'localhost'"
- **Cause**: Wrong password or user doesn't exist
- **Fix**: Reset password or create user

#### Issue: "Can't connect to MySQL server"
- **Cause**: MySQL service not running
- **Fix**: Start MySQL service

#### Issue: "Connection refused"
- **Cause**: MySQL not listening on expected port
- **Fix**: Check port configuration in MySQL

## Quick Test
Run this command to test your current setup:
```bash
cd server\beacon_server
python setup_mysql.py
```

Choose option 2 to test the connection.

## Fallback Option
If MySQL continues to cause issues, you can temporarily use SQLite by setting:
```env
USE_SQLITE=True
```

This will allow the application to run while you troubleshoot MySQL.

## Need Help?
1. Check MySQL error logs
2. Verify service status
3. Test manual connection
4. Check firewall/antivirus settings
5. Ensure MySQL is properly installed
