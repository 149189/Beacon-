import 'package:flutter/foundation.dart';
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationData {
  final double latitude;
  final double longitude;
  final double accuracy;
  final double? altitude;
  final double? speed;
  final double? heading;
  final String provider;
  final int? batteryLevel;
  final DateTime timestamp;

  const LocationData({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    this.altitude,
    this.speed,
    this.heading,
    this.provider = 'gps',
    this.batteryLevel,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'altitude': altitude,
      'speed': speed,
      'heading': heading,
      'provider': provider,
      'batteryLevel': batteryLevel,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class LocationService {
  static final LocationService _instance = LocationService._internal();
  static LocationService get instance => _instance;
  LocationService._internal();

  bool _initialized = false;
  bool _isTracking = false;
  Timer? _locationTimer;
  StreamSubscription<Position>? _positionStream;
  
  // Location update callback
  Function(LocationData)? onLocationUpdate;
  Function(LocationData)? onPanicAlert;

  Future<void> initialize() async {
    if (_initialized) return;
    
    // Request location permissions
    final locationPermission = await Permission.location.request();
    if (locationPermission != PermissionStatus.granted) {
      throw Exception('Location permission denied');
    }

    // Check if location services are enabled
    final isLocationEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isLocationEnabled) {
      throw Exception('Location services are disabled');
    }

    _initialized = true;
    debugPrint('LocationService: initialized with permissions granted');
  }

  Future<LocationData> getCurrentLocation() async {
    if (!_initialized) {
      await initialize();
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      return LocationData(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        altitude: position.altitude,
        speed: position.speed,
        heading: position.heading,
        provider: position.provider,
        timestamp: DateTime.now(),
      );
    } catch (e) {
      debugPrint('Error getting current location: $e');
      rethrow;
    }
  }

  void startTracking({int intervalSeconds = 5}) {
    if (!_initialized || _isTracking) return;

    _isTracking = true;
    debugPrint('LocationService: Started tracking with $intervalSeconds second interval');

    // Start continuous location updates
    _positionStream = Geolocator.getPositionStream(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
        timeLimit: Duration(seconds: intervalSeconds),
      ),
    ).listen(
      (Position position) {
        final locationData = LocationData(
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          altitude: position.altitude,
          speed: position.speed,
          heading: position.heading,
          provider: position.provider,
          timestamp: DateTime.now(),
        );

        // Notify listeners
        onLocationUpdate?.call(locationData);
      },
      onError: (error) {
        debugPrint('Location tracking error: $error');
      },
    );
  }

  void stopTracking() {
    if (!_isTracking) return;

    _isTracking = false;
    _positionStream?.cancel();
    _locationTimer?.cancel();
    debugPrint('LocationService: Stopped tracking');
  }

  Future<void> triggerPanicAlert({
    required int userId,
    String? description,
    Map<String, dynamic>? deviceInfo,
    Map<String, dynamic>? networkInfo,
  }) async {
    try {
      final locationData = await getCurrentLocation();
      
      // Create panic alert data
      final alertData = {
        'userId': userId,
        'latitude': locationData.latitude,
        'longitude': locationData.longitude,
        'accuracy': locationData.accuracy,
        'alertType': 'panic_button',
        'description': description ?? '',
        'deviceInfo': deviceInfo ?? {},
        'networkInfo': networkInfo ?? {},
        ...locationData.toJson(),
      };

      // Notify panic alert listeners
      onPanicAlert?.call(locationData);

      debugPrint('Panic alert triggered: $alertData');
      return alertData;
    } catch (e) {
      debugPrint('Error triggering panic alert: $e');
      rethrow;
    }
  }

  bool get isTracking => _isTracking;
  bool get isInitialized => _initialized;
}
