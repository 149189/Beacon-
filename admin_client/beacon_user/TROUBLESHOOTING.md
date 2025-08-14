# Troubleshooting Guide

This guide helps you resolve common issues with the Beacon Admin Client.

## Common Issues and Solutions

### 1. Application Won't Start

**Symptoms:**
- White screen or blank page
- Console errors about missing modules
- Build errors

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear browser cache
# Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Check if all dependencies are installed
npm list --depth=0
```

### 2. API Connection Issues

**Symptoms:**
- "API Offline" indicator in bottom-left corner
- Failed to load dashboard data
- Login errors

**Solutions:**
1. **Ensure backend is running:**
   ```bash
   cd server/beacon_server
   python manage.py runserver
   ```

2. **Check API URL in `src/services/api.js`:**
   ```javascript
   const API_BASE_URL = 'http://localhost:8000/api';
   ```

3. **Verify CORS settings in Django:**
   ```python
   # settings.py
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:5173",  # Vite dev server
       "http://127.0.0.1:5173",
   ]
   ```

4. **Check network connectivity:**
   - Open browser dev tools → Network tab
   - Look for failed requests to `localhost:8000`

### 3. Authentication Issues

**Symptoms:**
- Stuck on login page
- "Authentication failed" errors
- Token refresh issues

**Solutions:**
1. **Clear browser storage:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Check token expiration:**
   - Tokens expire after 5 minutes (access) and 1 day (refresh)
   - Automatic refresh should handle this

3. **Verify login credentials:**
   - Default: `admin` / `admin123`
   - Check Django admin for user status

### 4. UI Rendering Issues

**Symptoms:**
- Missing styles or broken layout
- Components not loading
- Tailwind CSS not working

**Solutions:**
1. **Check Tailwind configuration:**
   ```bash
   # Verify tailwind.config.js exists and is correct
   cat tailwind.config.js
   ```

2. **Rebuild CSS:**
   ```bash
   npm run build
   npm run dev
   ```

3. **Check for CSS conflicts:**
   - Disable browser extensions
   - Try incognito/private mode

### 5. Component Errors

**Symptoms:**
- Error boundary shows error page
- Specific components fail to load
- Console shows React errors

**Solutions:**
1. **Check component imports:**
   ```javascript
   // Verify all imports are correct
   import { Button } from '../components/ui/button';
   ```

2. **Check for missing dependencies:**
   ```bash
   npm install lucide-react
   npm install class-variance-authority
   ```

3. **Verify file paths:**
   - All component files should exist
   - Check for typos in file names

### 6. Data Loading Issues

**Symptoms:**
- Empty dashboard
- "No data" messages
- Infinite loading spinners

**Solutions:**
1. **Check database:**
   ```bash
   cd server/beacon_server
   python manage.py shell
   ```
   ```python
   from beacon_auth.models import User, Message, UserActivity
   print(f"Users: {User.objects.count()}")
   print(f"Messages: {Message.objects.count()}")
   ```

2. **Create test data:**
   ```bash
   python manage.py createsuperuser
   # Then create some test messages via admin interface
   ```

3. **Check API responses:**
   - Open browser dev tools → Network tab
   - Look at actual API responses

### 7. Performance Issues

**Symptoms:**
- Slow loading times
- Laggy interactions
- High memory usage

**Solutions:**
1. **Optimize bundle size:**
   ```bash
   npm run build
   # Check bundle analyzer output
   ```

2. **Reduce API calls:**
   - Check for unnecessary re-renders
   - Implement proper memoization

3. **Browser optimization:**
   - Disable unnecessary extensions
   - Clear browser cache regularly

## Development Tools

### Browser Dev Tools
- **F12** or **Ctrl+Shift+I** (Windows/Linux)
- **Cmd+Option+I** (Mac)
- Check Console, Network, and Application tabs

### React Dev Tools
- Install React Developer Tools browser extension
- Inspect component hierarchy and state

### Django Debug Toolbar
- Shows SQL queries, request info
- Available in development mode

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Beacon Admin
```

### Backend (config.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
USE_SQLITE=True
```

## Log Files

### Frontend Logs
- Browser console (F12 → Console)
- Vite dev server output

### Backend Logs
- Django development server output
- Check for error messages in terminal

## Common Error Messages

### "Module not found"
```bash
npm install [package-name]
```

### "CORS error"
- Check Django CORS settings
- Verify API URL is correct

### "Token expired"
- Automatic refresh should handle this
- If persistent, clear localStorage

### "Network error"
- Check if backend is running
- Verify network connectivity
- Check firewall settings

## Getting Help

1. **Check this troubleshooting guide first**
2. **Review browser console for specific errors**
3. **Check Django server logs for backend issues**
4. **Verify all dependencies are installed**
5. **Ensure both frontend and backend are running**

## Quick Fixes

### Reset Everything
```bash
# Frontend
cd admin_client/beacon_user
rm -rf node_modules package-lock.json
npm install
npm run dev

# Backend
cd server/beacon_server
python manage.py migrate
python manage.py runserver
```

### Clear All Data
```bash
# Clear browser data
localStorage.clear();
sessionStorage.clear();

# Reset database (WARNING: deletes all data)
cd server/beacon_server
python manage.py flush
```

### Update Dependencies
```bash
# Frontend
npm update

# Backend
pip install --upgrade -r requirements.txt
```
