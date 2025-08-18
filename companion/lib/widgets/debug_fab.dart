import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class DebugFloatingActionButton extends StatelessWidget {
  const DebugFloatingActionButton({super.key});

  @override
  Widget build(BuildContext context) {
    // Only show in debug mode
    if (!const bool.fromEnvironment('dart.vm.product')) {
      return FloatingActionButton(
        onPressed: () => _showDebugMenu(context),
        backgroundColor: Colors.orange,
        tooltip: 'Debug Menu',
        child: const Icon(Icons.bug_report),
      );
    }
    return const SizedBox.shrink();
  }

  void _showDebugMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => const DebugMenu(),
    );
  }
}

class DebugMenu extends StatelessWidget {
  const DebugMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Debug Menu',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // WebSocket Test Screen
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pushNamed('/websocket-test');
            },
            icon: const Icon(Icons.wifi),
            label: const Text('WebSocket Test'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),

          const SizedBox(height: 10),

          // Quick Login (for testing)
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.of(context).pop();
              await _quickLogin(context);
            },
            icon: const Icon(Icons.login),
            label: const Text('Quick Test Login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),

          const SizedBox(height: 10),

          // Check Auth Status
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pop();
              _showAuthStatus(context);
            },
            icon: const Icon(Icons.person),
            label: const Text('Check Auth Status'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple,
              foregroundColor: Colors.white,
            ),
          ),

          const SizedBox(height: 10),

          // Close Debug Menu
          ElevatedButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close),
            label: const Text('Close'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.grey,
              foregroundColor: Colors.white,
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Future<void> _quickLogin(BuildContext context) async {
    try {
      // For testing purposes - this would normally be done through proper UI
      final scaffoldMessenger = ScaffoldMessenger.of(context);

      // This is a mock quick login for testing
      // In a real scenario, you'd have proper credentials
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Quick login attempted - check AuthService status'),
          backgroundColor: Colors.blue,
        ),
      );

      // Check if already logged in
      if (AuthService.instance.isLoggedIn) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('Already logged in!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('Not logged in - use Login screen first'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Login error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showAuthStatus(BuildContext context) {
    final isLoggedIn = AuthService.instance.isLoggedIn;
    final user = AuthService.instance.currentUser;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Authentication Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Logged In: ${isLoggedIn ? "Yes" : "No"}'),
            const SizedBox(height: 8),
            Text('User: ${user?.toString() ?? "None"}'),
            const SizedBox(height: 8),
            Text(
                'Has Token: ${AuthService.instance.hasValidToken ? "Yes" : "No"}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          if (isLoggedIn)
            TextButton(
              onPressed: () async {
                await AuthService.instance.logout();
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Logged out'),
                    backgroundColor: Colors.orange,
                  ),
                );
              },
              child: const Text('Logout'),
            ),
        ],
      ),
    );
  }
}
