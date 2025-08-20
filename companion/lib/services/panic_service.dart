import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../utils/constants.dart';
import '../models/panic_alert.dart';
import 'auth_service.dart';
import 'location_service.dart';
import 'websocket_service.dart';
import 'api_service.dart';

class PanicService {
  static final PanicService _instance = PanicService._internal();
  static PanicService get instance => _instance;
  PanicService._internal();

  // Service state
  bool _isInitialized = false;
  PanicAlert? _activeAlert;
  Timer? _locationUpdateTimer;

  // Stream controllers for real-time updates
  final StreamController<PanicAlert> _alertStreamController =
      StreamController<PanicAlert>.broadcast();
  final StreamController<String> _statusStreamController =
      StreamController<String>.broadcast();

  // Getters
  bool get isInitialized => _isInitialized;
  PanicAlert? get activeAlert => _activeAlert;
  bool get hasActiveAlert => _activeAlert != null && _activeAlert!.isActive;

  // Stream getters
  Stream<PanicAlert> get alertStream => _alertStreamController.stream;
  Stream<String> get statusStream => _statusStreamController.stream;

  /// Initialize the panic service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      debugPrint('PanicService: Initializing...');

      // Ensure other services are initialized
      await AuthService.instance.initialize();
      await LocationService.instance.initialize();

      // Initialize WebSocket service if user is logged in
      if (AuthService.instance.isLoggedIn) {
        await WebSocketService.instance.initialize();
        _listenToWebSocketUpdates();
      }

      // Load any active alerts from storage
      await _loadActiveAlert();

      // Set up shake detection if enabled
      await _setupShakeDetection();

      _isInitialized = true;
      debugPrint('PanicService: Initialized successfully');
    } catch (e) {
      debugPrint('PanicService: Initialization failed: $e');
      rethrow;
    }
  }

  /// Create and send a panic alert
  Future<PanicAlert?> createPanicAlert({
    String alertType = AppConstants.panicButtonAlert,
    int priority = AppConstants.criticalPriority,
    String? description,
    bool isSilent = false,
    bool autoCallEmergency = false,
    Map<String, dynamic>? deviceInfo,
  }) async {
    try {
      debugPrint('PanicService: Creating panic alert...');

      // Check if user is authenticated
      if (!AuthService.instance.isLoggedIn) {
        throw Exception('User must be logged in to create alerts');
      }

      // Check if there's already an active alert
      if (hasActiveAlert) {
        throw Exception('There is already an active alert');
      }

      // Get current location
      final location = await LocationService.instance.getCurrentLocation();

      // Prepare alert data
      final alertData = {
        'alert_type': alertType,
        'priority': priority,
        'latitude': location.latitude,
        'longitude': location.longitude,
        'location_accuracy': location.accuracy,
        'address': '',
        'description': description ?? 'Emergency alert triggered',
        'is_silent': isSilent,
        'auto_call_emergency': autoCallEmergency,
        'device_info': deviceInfo ?? await _getDeviceInfo(),
        'network_info': await _getNetworkInfo(),
      };

      // Send alert to server
      final response = await ApiService.instance.post(
        AppConstants.createPanicAlertEndpoint,
        data: alertData,
      );

      if (response['success'] == true) {
        final alertId = response['alert_id'];

        // Create local alert object
        final alert = PanicAlert(
          id: alertId,
          alertType: alertType,
          status: AppConstants.activeStatus,
          priority: priority,
          latitude: location.latitude,
          longitude: location.longitude,
          locationAccuracy: location.accuracy,
          address: '',
          description: description ?? 'Emergency alert triggered',
          isSilent: isSilent,
          autoCallEmergency: autoCallEmergency,
          createdAt: DateTime.now(),
        );

        // Set as active alert
        _activeAlert = alert;
        await _saveActiveAlert();

        // Start location tracking
        _startLocationTracking();

        // Notify listeners
        _alertStreamController.add(alert);
        _statusStreamController.add('Alert created successfully');

        // Trigger haptic feedback
        await _triggerHapticFeedback();

        debugPrint('PanicService: Alert created successfully: $alertId');
        return alert;
      } else {
        throw Exception('Failed to create alert on server');
      }
    } catch (e) {
      debugPrint('PanicService: Error creating panic alert: $e');
      _statusStreamController.add('Error creating alert: $e');
      rethrow;
    }
  }

  /// Update location for active alert
  Future<void> updateLocation() async {
    if (!hasActiveAlert) return;

    try {
      final location = await LocationService.instance.getCurrentLocation();

      final locationData = {
        'latitude': location.latitude,
        'longitude': location.longitude,
        'accuracy': location.accuracy,
        'provider': 'gps',
        'battery_level': await _getBatteryLevel(),
      };

      final endpoint = AppConstants.getLocationEndpoint(_activeAlert!.id);
      await ApiService.instance.post(endpoint, data: locationData);

      // Update local alert
      _activeAlert = _activeAlert!.copyWith(
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracy: location.accuracy,
      );

      await _saveActiveAlert();
      _alertStreamController.add(_activeAlert!);
    } catch (e) {
      debugPrint('PanicService: Error updating location: $e');
    }
  }

  /// Cancel the active panic alert
  Future<void> cancelAlert() async {
    if (!hasActiveAlert) return;

    try {
      debugPrint('PanicService: Canceling alert...');

      final endpoint = AppConstants.getCancelEndpoint(_activeAlert!.id);
      final response = await ApiService.instance.post(endpoint);

      if (response['success'] == true) {
        // Update local alert
        _activeAlert = _activeAlert!.copyWith(
          status: AppConstants.canceledStatus,
          resolvedAt: DateTime.now(),
        );

        // Stop location tracking
        _stopLocationTracking();

        // Clear active alert
        await _clearActiveAlert();

        // Notify listeners
        _alertStreamController.add(_activeAlert!);
        _statusStreamController.add('Alert canceled successfully');

        debugPrint('PanicService: Alert canceled successfully');
      } else {
        throw Exception('Failed to cancel alert on server');
      }
    } catch (e) {
      debugPrint('PanicService: Error canceling alert: $e');
      _statusStreamController.add('Error canceling alert: $e');
      rethrow;
    }
  }

  /// Get alert history
  Future<List<PanicAlert>> getAlertHistory() async {
    try {
      final response =
          await ApiService.instance.get(AppConstants.alertsEndpoint);

      final List<dynamic> alertsJson =
          response is List ? response : (response['results'] ?? response['alerts'] ?? []);
      return alertsJson.map((json) => PanicAlert.fromJson(json)).toList();
    } catch (e) {
      debugPrint('PanicService: Error getting alert history: $e');
      return [];
    }
  }

  /// Start automatic location tracking for active alert
  void _startLocationTracking() {
    if (_locationUpdateTimer != null) return;

    _locationUpdateTimer = Timer.periodic(
      const Duration(seconds: AppConstants.locationUpdateInterval),
      (_) => _updateLocationWithWebSocket(),
    );

    debugPrint('PanicService: Location tracking started');
  }

  /// Stop automatic location tracking
  void _stopLocationTracking() {
    _locationUpdateTimer?.cancel();
    _locationUpdateTimer = null;
    debugPrint('PanicService: Location tracking stopped');
  }

  /// Setup shake detection for panic alerts
  Future<void> _setupShakeDetection() async {
    // TODO: Implement shake detection using accelerometer
    // This would use the sensors_plus package to detect shake gestures
    debugPrint('PanicService: Shake detection setup (placeholder)');
  }

  /// Load active alert from storage
  Future<void> _loadActiveAlert() async {
    try {
      // TODO: Implement storage loading
      debugPrint(
          'PanicService: Loading active alert from storage (placeholder)');
    } catch (e) {
      debugPrint('PanicService: Error loading active alert: $e');
    }
  }

  /// Save active alert to storage
  Future<void> _saveActiveAlert() async {
    try {
      // TODO: Implement storage saving
      debugPrint('PanicService: Saving active alert to storage (placeholder)');
    } catch (e) {
      debugPrint('PanicService: Error saving active alert: $e');
    }
  }

  /// Clear active alert from storage
  Future<void> _clearActiveAlert() async {
    try {
      _activeAlert = null;
      // TODO: Implement storage clearing
      debugPrint(
          'PanicService: Clearing active alert from storage (placeholder)');
    } catch (e) {
      debugPrint('PanicService: Error clearing active alert: $e');
    }
  }

  /// Get device information
  Future<Map<String, dynamic>> _getDeviceInfo() async {
    // TODO: Implement device info collection
    return {
      'platform': 'flutter',
      'version': AppConstants.appVersion,
      'device_model': 'Unknown',
    };
  }

  /// Get network information
  Future<Map<String, dynamic>> _getNetworkInfo() async {
    // TODO: Implement network info collection
    return {
      'connection_type': 'unknown',
      'signal_strength': 'unknown',
    };
  }

  /// Get battery level
  Future<int> _getBatteryLevel() async {
    try {
      // TODO: Implement battery level detection
      return 100; // Placeholder
    } catch (e) {
      return 0;
    }
  }

  /// Trigger haptic feedback
  Future<void> _triggerHapticFeedback() async {
    try {
      await HapticFeedback.vibrate();
    } catch (e) {
      debugPrint('PanicService: Error triggering haptic feedback: $e');
    }
  }

  /// Listen to WebSocket updates for real-time communication
  void _listenToWebSocketUpdates() {
    // Listen to alert status updates
    WebSocketService.instance.alertUpdates.listen((message) {
      _handleAlertUpdate(message);
    });

    // Listen to operator messages
    WebSocketService.instance.operatorMessages.listen((message) {
      _handleOperatorMessage(message);
    });

    debugPrint('PanicService: WebSocket listeners set up');
  }

  /// Handle alert status updates from WebSocket
  void _handleAlertUpdate(Map<String, dynamic> message) {
    try {
      final alertId = message['alert_id'];
      final status = message['status'];

      if (_activeAlert?.id == alertId) {
        // Update local alert status
        _activeAlert = _activeAlert!.copyWith(
          status: status,
          acknowledgedAt: status == AppConstants.acknowledgedStatus
              ? DateTime.now()
              : _activeAlert!.acknowledgedAt,
          resolvedAt: (status == AppConstants.resolvedStatus ||
                  status == AppConstants.canceledStatus)
              ? DateTime.now()
              : _activeAlert!.resolvedAt,
        );

        // Notify listeners
        _alertStreamController.add(_activeAlert!);
        _statusStreamController.add('Alert status updated: $status');

        // Stop tracking if alert is resolved/canceled
        if (status == AppConstants.resolvedStatus ||
            status == AppConstants.canceledStatus) {
          _stopLocationTracking();
          _clearActiveAlert();
        }

        debugPrint('PanicService: Alert status updated to $status');
      }
    } catch (e) {
      debugPrint('PanicService: Error handling alert update: $e');
    }
  }

  /// Handle operator messages from WebSocket
  void _handleOperatorMessage(Map<String, dynamic> message) {
    try {
      final messageText = message['message'];
      final operatorName = message['operator_name'] ?? 'Operator';

      _statusStreamController.add('$operatorName: $messageText');
      debugPrint('PanicService: Operator message received: $messageText');
    } catch (e) {
      debugPrint('PanicService: Error handling operator message: $e');
    }
  }

  /// Update location with WebSocket support
  Future<void> _updateLocationWithWebSocket() async {
    if (!hasActiveAlert) return;

    try {
      final location = await LocationService.instance.getCurrentLocation();

      // Send location update via WebSocket for real-time tracking
      final locationData = {
        'latitude': location.latitude,
        'longitude': location.longitude,
        'accuracy': location.accuracy,
        'provider': 'gps',
        'battery_level': await _getBatteryLevel(),
        'timestamp': DateTime.now().toIso8601String(),
      };

      // Send via WebSocket if connected
      if (WebSocketService.instance.isConnected) {
        await WebSocketService.instance.sendLocationUpdate(
          _activeAlert!.id,
          locationData,
        );
      }

      // Also send via HTTP API as backup
      await updateLocation();
    } catch (e) {
      debugPrint('PanicService: Error in WebSocket location update: $e');
      // Fallback to regular update
      await updateLocation();
    }
  }

  /// Send chat message to operator
  Future<void> sendChatMessage(String message) async {
    if (!hasActiveAlert) return;

    try {
      await WebSocketService.instance.sendChatMessage(
        _activeAlert!.id,
        message,
      );

      debugPrint('PanicService: Chat message sent: $message');
    } catch (e) {
      debugPrint('PanicService: Error sending chat message: $e');
      rethrow;
    }
  }

  /// Cancel alert via WebSocket
  Future<void> cancelAlertViaWebSocket() async {
    if (!hasActiveAlert) return;

    try {
      await WebSocketService.instance.cancelAlert(_activeAlert!.id);
      debugPrint('PanicService: Cancel request sent via WebSocket');
    } catch (e) {
      debugPrint('PanicService: Error canceling via WebSocket: $e');
      // Fallback to HTTP API
      await cancelAlert();
    }
  }

  /// Get WebSocket connection state stream
  Stream<WebSocketConnectionState> get connectionStateStream =>
      WebSocketService.instance.connectionStateStream;

  /// Check if WebSocket is connected
  bool get isWebSocketConnected => WebSocketService.instance.isConnected;

  /// Connect to alert-specific WebSocket channel
  Future<void> connectToAlertChannel(String alertId) async {
    try {
      await WebSocketService.instance.connectToAlert(alertId);
      debugPrint('PanicService: Connected to alert channel: $alertId');
    } catch (e) {
      debugPrint('PanicService: Error connecting to alert channel: $e');
    }
  }

  /// Disconnect from all WebSocket channels
  Future<void> disconnectWebSocket() async {
    try {
      await WebSocketService.instance.disconnect();
      debugPrint('PanicService: WebSocket disconnected');
    } catch (e) {
      debugPrint('PanicService: Error disconnecting WebSocket: $e');
    }
  }

  /// Dispose of the service
  void dispose() {
    _stopLocationTracking();
    _alertStreamController.close();
    _statusStreamController.close();
    _isInitialized = false;
    debugPrint('PanicService: Disposed');
  }
}
