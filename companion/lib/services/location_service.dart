import 'package:flutter/foundation.dart';

class LocationData {
  final double latitude;
  final double longitude;
  final double accuracy;

  const LocationData({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
  });
}

class LocationService {
  static final LocationService _instance = LocationService._internal();
  static LocationService get instance => _instance;
  LocationService._internal();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    // Stub init; hook up geolocator later
    _initialized = true;
    debugPrint('LocationService: initialized');
  }

  void startTracking() {
    // Stub
  }

  Future<LocationData> getCurrentLocation() async {
    // Return a placeholder location for now
    return const LocationData(
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10.0,
    );
  }

  void stopTracking() {
    // Stub
  }
}
