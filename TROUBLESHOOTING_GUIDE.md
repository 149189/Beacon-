# Beacon Application Troubleshooting Guide

## Quick Start
1. **Double-click** `run_beacon.bat` to start the launcher
2. **Choose an option** from the menu (1-6)
3. **Follow the prompts** to start your desired services

## Common Issues and Solutions

### ❌ Python Not Found
**Error**: `❌ Python is not installed or not in PATH`

**Solution**:
1. Install Python 3.8+ from [python.org](https://python.org)
2. During installation, check "Add Python to PATH"
3. Restart your computer after installation
4. Verify: Open Command Prompt and type `python --version`

### ❌ Node.js Not Found
**Error**: `❌ Node.js is not installed or not in PATH`

**Solution**:
1. Install Node.js 16+ from [nodejs.org](https://nodejs.org)
2. During installation, check "Add to PATH"
3. Restart your computer after installation
4. Verify: Open Command Prompt and type `node --version`

### ❌ MySQL Connection Failed
**Error**: `❌ Connection failed: 1045 (28000): Access denied for user 'root'@'localhost'`

**Solutions**:

#### Option 1: Check MySQL Service
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "MySQL80" or "MySQL" service
3. Right-click → Start (if stopped)
4. Right-click → Properties → Startup Type → Automatic

#### Option 2: Verify Credentials
1. Open `server\beacon_server\config.env`
2. Ensure these lines are correct:
   ```env
   MYSQL_USER=root
   MYSQL_PASSWORD=Kaustubh@149
   ```
3. **No spaces** around the `=` sign

#### Option 3: Test Manual Connection
1. Open Command Prompt as Administrator
2. Type: `mysql -u root -p`
3. Enter password: `Kaustubh@149`
4. If successful, type `exit`

#### Option 4: Reset MySQL Password
1. Stop MySQL service: `net stop MySQL80`
2. Start in safe mode: `mysqld --skip-grant-tables`
3. In new terminal: `mysql -u root`
4. Run: `UPDATE mysql.user SET authentication_string=PASSWORD('new_password') WHERE User='root';`
5. Run: `FLUSH PRIVILEGES; EXIT;`
6. Restart MySQL service: `net start MySQL80`

### ❌ Port Already in Use
**Error**: `Address already in use` or `Port 8000/3001/5173 is busy`

**Solutions**:
1. **Find what's using the port**:
   ```cmd
   netstat -ano | findstr :8000
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   ```

2. **Kill the process**:
   ```cmd
   taskkill /PID <PID_NUMBER> /F
   ```

3. **Or use different ports**:
   - Django: `python manage.py runserver 8001`
   - React: Modify `vite.config.js` port
   - Location: Modify `server.js` port

### ❌ Dependencies Not Installed
**Error**: `ModuleNotFoundError` or `Cannot find module`

**Solutions**:

#### Python Dependencies
```cmd
cd server\beacon_server
pip install -r requirements.txt
```

#### Node.js Dependencies
```cmd
cd admin_client\beacon_user
npm install

cd server\location_server
npm install
```

### ❌ Database Migration Issues
**Error**: `No migrations to apply` or `Table already exists`

**Solutions**:
```cmd
cd server\beacon_server
python manage.py makemigrations
python manage.py migrate
python manage.py setup_demo_data
```

### ❌ Permission Denied
**Error**: `Permission denied` or `Access is denied`

**Solutions**:
1. **Run as Administrator**: Right-click `run_beacon.bat` → Run as Administrator
2. **Check file permissions**: Ensure you have read/write access to the project folder
3. **Check antivirus**: Temporarily disable antivirus to test

### ❌ Firewall Blocking
**Error**: `Connection refused` or `Cannot connect to server`

**Solutions**:
1. **Windows Firewall**: Allow Python and Node.js through firewall
2. **Antivirus**: Add project folder to antivirus exclusions
3. **Check ports**: Ensure ports 8000, 3001, 5173 are not blocked

## Service-Specific Issues

### Django Backend Issues
- **Port 8000 busy**: Use `python manage.py runserver 8001`
- **Database errors**: Check `config.env` and MySQL connection
- **Static files**: Run `python manage.py collectstatic`

### React Frontend Issues
- **Port 5173 busy**: Modify `vite.config.js` port setting
- **Build errors**: Delete `node_modules` and run `npm install` again
- **Hot reload not working**: Check if port is available

### Location Server Issues
- **Port 3001 busy**: Modify `server.js` port setting
- **WebSocket errors**: Check if location server is running
- **Database connection**: Verify MySQL credentials

## Fallback Options

### Use SQLite Instead of MySQL
1. Edit `server\beacon_server\config.env`
2. Change: `USE_SQLITE=True`
3. Restart the launcher
4. Choose option 1 (SQLite)

### Start Services Individually
1. **Django only**: Choose option 4 (MySQL Servers)
2. **Frontend only**: Navigate to `admin_client\beacon_user` and run `npm run dev`
3. **Location only**: Choose option 3 (Location Server Only)

## Debug Mode

### Enable Verbose Logging
1. Edit `server\beacon_server\config.env`
2. Change: `DEBUG=True`
3. Restart Django server

### Check Logs
- **Django**: Check console output in Django window
- **React**: Check console output in React window
- **Location**: Check `location_server.log` file

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11
- **Python**: 3.8+
- **Node.js**: 16+
- **RAM**: 4GB
- **Storage**: 2GB free space

### Recommended Requirements
- **OS**: Windows 11
- **Python**: 3.11+
- **Node.js**: 18+
- **RAM**: 8GB+
- **Storage**: 5GB free space

## Getting Help

### Before Asking for Help
1. ✅ Check this troubleshooting guide
2. ✅ Verify system requirements
3. ✅ Check if services are running
4. ✅ Look at error messages carefully
5. ✅ Try the fallback options

### When Asking for Help
Include:
- **Error message** (copy exactly)
- **What you were trying to do**
- **Your system info** (Windows version, Python/Node versions)
- **Steps you've already tried**

### Contact Information
- **GitHub Issues**: Create an issue in the repository
- **Documentation**: Check `README.md` and other `.md` files
- **Community**: Check project discussions and forums

## Quick Commands Reference

```cmd
# Check Python version
python --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check MySQL service
sc query MySQL80

# Start MySQL service
net start MySQL80

# Stop MySQL service
net stop MySQL80

# Check what's using a port
netstat -ano | findstr :8000

# Kill process by PID
taskkill /PID <PID> /F
```
