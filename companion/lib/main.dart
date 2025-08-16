import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/panic_screen.dart';
import 'screens/emergency_contacts_screen.dart';
import 'screens/alert_history_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/websocket_test_screen.dart';
import 'services/auth_service.dart';
import 'services/location_service.dart';
import 'services/panic_service.dart';
import 'utils/theme.dart';
import 'utils/constants.dart';

void main() {
  runApp(const BeaconApp());
}

class BeaconApp extends StatelessWidget {
  const BeaconApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Beacon - Safety First',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/panic': (context) => const PanicScreen(),
        '/emergency-contacts': (context) => const EmergencyContactsScreen(),
        '/alert-history': (context) => const AlertHistoryScreen(),
        '/settings': (context) => const SettingsScreen(),
        '/websocket-test': (context) => const WebSocketTestScreen(),
      },
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaleFactor: 1.0),
          child: child!,
        );
      },
    );
  }
}

/// Main app theme with Beacon branding
class AmraThemeApp extends StatefulWidget {
  const AmraThemeApp({super.key});

  @override
  State<AmraThemeApp> createState() => _AmraThemeAppState();
}

class _AmraThemeAppState extends State<AmraThemeApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeApp();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    switch (state) {
      case AppLifecycleState.resumed:
        // App is resumed, start location tracking if needed
        LocationService.instance.startTracking();
        break;
      case AppLifecycleState.paused:
        // App is paused but keep essential services running
        break;
      case AppLifecycleState.detached:
        // App is being terminated
        break;
      case AppLifecycleState.inactive:
        // App is inactive
        break;
      case AppLifecycleState.hidden:
        // App is hidden
        break;
    }
  }

  Future<void> _initializeApp() async {
    try {
      // Request necessary permissions
      await _requestPermissions();
      
      // Initialize services
      await AuthService.instance.initialize();
      await LocationService.instance.initialize();
      await PanicService.instance.initialize();
      
    } catch (e) {
      debugPrint('Error initializing app: $e');
    }
  }

  Future<void> _requestPermissions() async {
    final permissions = [
      Permission.location,
      Permission.locationAlways,
      Permission.camera,
      Permission.microphone,
      Permission.storage,
      Permission.notification,
      Permission.phone,
    ];

    for (final permission in permissions) {
      if (await permission.isDenied) {
        await permission.request();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const BeaconApp();
  }
}
