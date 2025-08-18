import 'package:flutter/material.dart';

class AppConstants {
  // App Information
  static const String appName = 'Beacon';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Your Signal for Safety';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:8000'; // Change for production
  static const String apiBasePath = '/api/auth';
  static const String wsBaseUrl = 'ws://localhost:8000'; // WebSocket URL
  
  // API Endpoints
  static const String loginEndpoint = '$apiBasePath/login/';
  static const String registerEndpoint = '$apiBasePath/register/';
  static const String logoutEndpoint = '$apiBasePath/logout/';
  static const String profileEndpoint = '$apiBasePath/profile/';
  static const String alertsEndpoint = '$apiBasePath/alerts/';
  static const String emergencyContactsEndpoint = '$apiBasePath/emergency-contacts/';
  static const String dashboardStatsEndpoint = '$apiBasePath/dashboard/stats/';
  
  // Panic Alert Endpoints
  static const String createAlertEndpoint = '$apiBasePath/alerts/';
  static const String alertLocationEndpoint = '$apiBasePath/alerts/{id}/location/';
  static const String alertMediaEndpoint = '$apiBasePath/alerts/{id}/media/';
  static const String cancelAlertEndpoint = '$apiBasePath/alerts/{id}/cancel/';
  
  // WebSocket Endpoints
  static const String alertsWebSocketEndpoint = '/ws/alerts/';
  static const String chatWebSocketEndpoint = '/ws/chat/';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String userProfileKey = 'user_profile';
  static const String settingsKey = 'app_settings';
  static const String emergencyContactsKey = 'emergency_contacts';
  static const String offlineAlertsKey = 'offline_alerts';
  static const String locationHistoryKey = 'location_history';
  
  // Settings Keys
  static const String locationTrackingEnabledKey = 'location_tracking_enabled';
  static const String backgroundLocationKey = 'background_location_enabled';
  static const String autoRecordAudioKey = 'auto_record_audio';
  static const String autoRecordVideoKey = 'auto_record_video';
  static const String shakeToAlertKey = 'shake_to_alert_enabled';
  static const String doNotDisturbKey = 'do_not_disturb_mode';
  static const String silentModeKey = 'silent_mode_enabled';
  static const String biometricEnabledKey = 'biometric_enabled';
  
  // Alert Types
  static const String panicButtonAlert = 'panic_button';
  static const String shakeToAlert = 'shake_to_alert';
  static const String decoyScreenAlert = 'decoy_screen';
  static const String manualAlert = 'manual';
  static const String scheduledAlert = 'scheduled';
  
  // Alert Status
  static const String activeStatus = 'active';
  static const String acknowledgedStatus = 'acknowledged';
  static const String respondingStatus = 'responding';
  static const String resolvedStatus = 'resolved';
  static const String falseAlarmStatus = 'false_alarm';
  static const String canceledStatus = 'canceled';
  
  // Priority Levels
  static const int lowPriority = 1;
  static const int mediumPriority = 2;
  static const int highPriority = 3;
  static const int criticalPriority = 4;
  static const int emergencyPriority = 5;
  
  // Location Settings
  static const double locationAccuracyThreshold = 50.0; // meters
  static const int locationUpdateInterval = 30; // seconds
  static const int maxLocationHistory = 100; // number of points
  static const double minDistanceFilter = 10.0; // meters
  
  // Media Settings
  static const int maxVideoLength = 60; // seconds
  static const int maxAudioLength = 120; // seconds
  static const int maxMediaFileSize = 50 * 1024 * 1024; // 50 MB
  static const List<String> allowedImageFormats = ['jpg', 'jpeg', 'png'];
  static const List<String> allowedVideoFormats = ['mp4', '3gp'];
  static const List<String> allowedAudioFormats = ['aac', 'm4a', 'mp3'];
  
  // Network Settings
  static const int connectionTimeout = 30; // seconds
  static const int receiveTimeout = 30; // seconds
  static const int maxRetries = 3;
  static const int retryDelay = 2; // seconds
  
  // UI Constants
  static const primaryColor = Color(0xFF2196F3); // Blue color
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double defaultBorderRadius = 12.0;
  static const double smallBorderRadius = 8.0;
  static const double largeBorderRadius = 16.0;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 400);
  static const Duration longAnimation = Duration(milliseconds: 600);
  
  // Emergency Numbers (can be customized per region)
  static const Map<String, String> emergencyNumbers = {
    'police': '911',
    'fire': '911',
    'medical': '911',
    'general': '911',
  };
  
  // Contact Types
  static const String primaryContactType = 'primary';
  static const String secondaryContactType = 'secondary';
  static const String familyContactType = 'family';
  static const String friendContactType = 'friend';
  static const String medicalContactType = 'medical';
  static const String legalContactType = 'legal';
  
  // Notification Types
  static const String smsNotification = 'sms';
  static const String emailNotification = 'email';
  static const String pushNotification = 'push';
  static const String callNotification = 'call';
  
  // Media Types
  static const String audioMedia = 'audio';
  static const String videoMedia = 'video';
  static const String photoMedia = 'photo';
  static const String screenshotMedia = 'screenshot';
  
  // Validation Rules
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 50;
  static final RegExp emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  static final RegExp phoneRegex = RegExp(r'^\+?[1-9]\d{1,14}$');
  
  // Error Messages
  static const String networkErrorMessage = 'Network connection error. Please check your internet connection.';
  static const String serverErrorMessage = 'Server error. Please try again later.';
  static const String authErrorMessage = 'Authentication failed. Please login again.';
  static const String locationErrorMessage = 'Location access denied. Please enable location permissions.';
  static const String cameraErrorMessage = 'Camera access denied. Please enable camera permissions.';
  static const String microphoneErrorMessage = 'Microphone access denied. Please enable microphone permissions.';
  static const String storageErrorMessage = 'Storage access denied. Please enable storage permissions.';
  
  // Success Messages
  static const String alertCreatedMessage = 'Emergency alert sent successfully!';
  static const String alertCanceledMessage = 'Alert canceled successfully.';
  static const String profileUpdatedMessage = 'Profile updated successfully.';
  static const String contactAddedMessage = 'Emergency contact added successfully.';
  static const String contactUpdatedMessage = 'Emergency contact updated successfully.';
  static const String contactDeletedMessage = 'Emergency contact deleted successfully.';
  
  // Shake Detection Settings
  static const double shakeThreshold = 2.7; // g-force threshold
  static const int shakeCooldown = 5; // seconds between shake detections
  static const int shakeCountThreshold = 3; // number of shakes needed
  
  // Background Task Settings
  static const String locationTaskIdentifier = 'location_background_task';
  static const String syncTaskIdentifier = 'sync_background_task';
  static const int backgroundSyncInterval = 300; // 5 minutes in seconds
  
  // Encryption Settings
  static const String encryptionAlgorithm = 'AES-256-GCM';
  static const int keySize = 256; // bits
  static const int ivSize = 16; // bytes
  
  // Development Settings
  static const bool isDebugMode = true; // Set to false for production
  static const bool enableLogging = true;
  static const bool enableCrashReporting = false; // Enable in production
  static const bool mockLocationInDev = false;
  
  // Helper methods
  static String getAlertEndpoint(String alertId) {
    return '$alertsEndpoint$alertId/';
  }
  
  static String getLocationEndpoint(String alertId) {
    return alertLocationEndpoint.replaceAll('{id}', alertId);
  }
  
  static String getMediaEndpoint(String alertId) {
    return alertMediaEndpoint.replaceAll('{id}', alertId);
  }
  
  static String getCancelEndpoint(String alertId) {
    return cancelAlertEndpoint.replaceAll('{id}', alertId);
  }
  
  static String getPriorityDisplayName(int priority) {
    switch (priority) {
      case lowPriority:
        return 'Low';
      case mediumPriority:
        return 'Medium';
      case highPriority:
        return 'High';
      case criticalPriority:
        return 'Critical';
      case emergencyPriority:
        return 'Emergency';
      default:
        return 'Unknown';
    }
  }
  
  static String getStatusDisplayName(String status) {
    switch (status) {
      case activeStatus:
        return 'Active';
      case acknowledgedStatus:
        return 'Acknowledged';
      case respondingStatus:
        return 'Responding';
      case resolvedStatus:
        return 'Resolved';
      case falseAlarmStatus:
        return 'False Alarm';
      case canceledStatus:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  }
}
