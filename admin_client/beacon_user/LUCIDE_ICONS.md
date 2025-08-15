# Lucide React Icons Reference

This document lists all the lucide-react icons used in the Beacon Admin Client to prevent import errors.

## Commonly Used Icons

### Navigation & UI
- `Home` - Dashboard/home icon
- `Menu` - Hamburger menu icon
- `X` - Close/cancel icon
- `Search` - Search magnifying glass
- `Filter` - Filter funnel icon
- `RefreshCw` - Refresh/reload icon
- `Loader2` - Loading spinner
- `MoreVertical` - Three dots menu

### User & Authentication
- `User` - Single user icon
- `Users` - Multiple users icon
- `UserCheck` - User with checkmark
- `UserX` - User with X
- `LogIn` - Login arrow (NOT `Login`)
- `LogOut` - Logout arrow

### Messages & Communication
- `MessageSquare` - Message bubble
- `MessageCircle` - Message circle
- `Mail` - Email icon
- `Reply` - Reply arrow

### Status & Actions
- `CheckCircle` - Success/check icon
- `AlertCircle` - Warning/alert icon
- `AlertTriangle` - Error triangle
- `Info` - Information icon
- `Eye` - View/read icon
- `Clock` - Time/clock icon
- `Calendar` - Calendar icon
- `Activity` - Activity/analytics icon

### System & Settings
- `Settings` - Gear/settings icon
- `BarChart3` - Analytics chart
- `Bell` - Notification bell
- `Archive` - Archive box
- `Wifi` - WiFi signal
- `WifiOff` - WiFi off
- `Lock` - Lock icon
- `EyeOff` - Hide/password icon

### Layout & Design
- `Card` - Card container
- `Button` - Button component
- `Input` - Input field
- `Label` - Form label

## Common Import Errors to Avoid

❌ **Incorrect:**
```javascript
import { Login } from 'lucide-react';  // This doesn't exist
```

✅ **Correct:**
```javascript
import { LogIn } from 'lucide-react';  // This is the correct name
```

## Full Import Example

```javascript
import {
    // Navigation
    Home,
    Menu,
    X,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    MoreVertical,
    
    // Users
    User,
    Users,
    UserCheck,
    UserX,
    LogIn,  // Note: LogIn, not Login
    LogOut,
    
    // Messages
    MessageSquare,
    MessageCircle,
    Mail,
    Reply,
    
    // Status
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    Eye,
    EyeOff,
    Clock,
    Calendar,
    Activity,
    
    // System
    Settings,
    BarChart3,
    Bell,
    Archive,
    Wifi,
    WifiOff,
    Lock
} from 'lucide-react';
```

## Icon Usage Examples

```javascript
// Basic usage
<Home className="h-4 w-4" />

// With colors
<CheckCircle className="h-4 w-4 text-green-500" />
<AlertCircle className="h-4 w-4 text-red-500" />

// With sizes
<Loader2 className="h-6 w-6 animate-spin" />
<Bell className="w-5 h-5" />

// In buttons
<Button>
    <LogIn className="w-4 h-4 mr-2" />
    Sign In
</Button>
```

## Troubleshooting

If you get an import error like:
```
The requested module does not provide an export named 'IconName'
```

1. Check the exact spelling (case-sensitive)
2. Verify the icon exists in lucide-react
3. Check the [Lucide Icons website](https://lucide.dev/icons/) for the correct name
4. Common mistakes:
   - `Login` → `LogIn`
   - `Usercheck` → `UserCheck`
   - `Messagecircle` → `MessageCircle`

## Adding New Icons

When adding new icons:

1. Check the [Lucide Icons website](https://lucide.dev/icons/)
2. Use the exact name from the website
3. Add to this reference document
4. Test the import before committing
