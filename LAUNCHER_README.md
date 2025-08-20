# Beacon Application Launcher

This is a consolidated launcher that combines all the functionality from the previous batch files into one easy-to-use interface.

## How to Use

1. **Double-click** `run_beacon.bat` to start the launcher
2. **Choose an option** from the menu (1-6)
3. **Follow the prompts** to start your desired services

## Available Options

### 1. Start Admin Panel (Default SQLite)
- Starts Django backend with SQLite database
- Starts React frontend
- Access at: http://localhost:8000 (Django) and http://localhost:5173 (React)

### 2. Start Admin Panel (MySQL)
- Starts Django backend with MySQL database
- Starts React frontend
- Includes MySQL connection check
- Access at: http://localhost:8000 (Django) and http://localhost:5173 (React)

### 3. Start Location Server Only
- Starts only the location tracking server
- Installs dependencies automatically
- Access at: http://localhost:3001

### 4. Start MySQL Servers (Django + Location)
- Starts Django server with MySQL
- Starts location server
- Access at: http://localhost:8000 (Django) and http://localhost:3001 (Location)

### 5. Start All Services (Admin + Location + MySQL)
- Starts all services together
- Django backend with MySQL
- React frontend
- Location server
- Access at: http://localhost:8000, http://localhost:5173, and http://localhost:3001

### 6. Exit
- Closes the launcher

## Demo Credentials

- **Admin**: username=admin, password=admin123
- **Demo User**: username=kaustubh, password=demo123

## Features

- **Menu-driven interface** - Easy to navigate
- **Consolidated functionality** - All previous batch files combined
- **Return to menu** - After each operation, return to main menu
- **Clear feedback** - Shows what's happening at each step
- **Proper directory handling** - Automatically navigates to correct directories
- **Dependency checking** - Verifies Python, Node.js, and MySQL before starting services
- **Enhanced error handling** - Better error messages and troubleshooting tips
- **Automatic path correction** - Handles directory navigation automatically

## What This Replaces

This launcher replaces the following individual batch files:
- `start_application.bat`
- `start_application_mysql.bat`
- `start_location_server.bat`
- `start_mysql_servers.bat`

## Benefits

- **Single file** to maintain instead of multiple
- **Consistent interface** across all operations
- **Easy to extend** with new options
- **Better user experience** with clear menu choices
- **Reduced clutter** in the project directory

## Usage Tips

- After starting services, you can return to the menu to start additional services
- Each service runs in its own command window
- The launcher waits for user input before returning to menu
- All paths are handled automatically
- The launcher checks dependencies before starting services
- If MySQL fails, you can still use SQLite by setting `USE_SQLITE=True` in `config.env`

## Troubleshooting

If you encounter issues:
1. Check the `TROUBLESHOOTING_GUIDE.md` for common solutions
2. Verify Python 3.8+ and Node.js 16+ are installed
3. Ensure MySQL service is running (if using MySQL)
4. Check if required ports (8000, 3001, 5173) are available
