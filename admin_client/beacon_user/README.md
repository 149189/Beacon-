# Beacon Admin Panel

A modern, responsive admin panel built with React, Vite, and Shadcn UI components.

## Features

- 🔐 **Authentication System** - Secure login with protected routes
- 📊 **Dashboard Overview** - Key metrics and statistics
- 👥 **Active Users Management** - Monitor user activity and status
- 💬 **Messages System** - View and manage user messages
- 🎨 **Modern UI** - Built with Shadcn UI components and Tailwind CSS
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Protected Routes** - Automatic redirection based on auth status

## Tech Stack

- **Frontend**: React 19 + Vite
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd admin_client/beacon_user
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Demo Credentials

For testing purposes, use these credentials:
- **Email**: `admin@beacon.com`
- **Password**: `admin123`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   └── Sidebar.jsx     # Main navigation sidebar
├── contexts/            # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/               # Page components
│   ├── Login.jsx       # Login page
│   └── Dashboard.jsx   # Main dashboard
├── lib/                 # Utility functions
│   └── utils.js        # Common utility functions
├── App.jsx              # Main app component with routing
└── main.jsx            # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Adding New Pages

1. Create a new component in the `src/pages/` directory
2. Add the route to `src/App.jsx`
3. Add navigation item to `src/components/Sidebar.jsx`

### Styling

The project uses Tailwind CSS with custom CSS variables for theming. Modify the CSS variables in `src/index.css` to change the color scheme.

## Deployment

Build the project for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
