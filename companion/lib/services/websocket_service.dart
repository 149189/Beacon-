import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import 'location_service.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  static WebSocketService get instance => _instance;
  WebSocketService._internal();

  WebSocketChannel? _channel;
  bool _isConnected = false;
  bool _isAuthenticated = false;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  
  // Configuration
  String _serverUrl = 'ws://localhost:3001';
  int _userId = 1; // Default user ID
  String _userType = 'user';
  
  // Callbacks
  Function(bool)? onConnectionStatusChanged;
  Function(Map<String, dynamic>)? onLocationUpdateResponse;
  Function(Map<String, dynamic>)? onPanicAlertResponse;
  Function(Map<String, dynamic>)? onAlertStatusUpdate;
  Function(String)? onError;

  // Connection state
  bool get isConnected => _isConnected;
  bool get isAuthenticated => _isAuthenticated;

  void configure({
    required String serverUrl,
    required int userId,
    String userType = 'user',
  }) {
    _serverUrl = serverUrl;
    _userId = userId;
    _userType = userType;
  }

  Future<void> connect() async {
    if (_isConnected) return;

    try {
      debugPrint('WebSocketService: Connecting to $_serverUrl');
      
      _channel = WebSocketChannel.connect(
        Uri.parse(_serverUrl.replaceFirst('http', 'ws')),
      );

      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnect,
      );

      _isConnected = true;
      onConnectionStatusChanged?.call(true);
      debugPrint('WebSocketService: Connected successfully');

      // Start heartbeat
      _startHeartbeat();

      // Authenticate
      await _authenticate();

    } catch (e) {
      debugPrint('WebSocketService: Connection failed: $e');
      onError?.call('Connection failed: $e');
      _scheduleReconnect();
    }
  }

  Future<void> _authenticate() async {
    if (!_isConnected) return;

    try {
      final authData = {
        'userId': _userId,
        'userType': _userType,
        'timestamp': DateTime.now().toIso8601String(),
      };

      _channel!.sink.add(jsonEncode({
        'event': 'authenticate',
        'data': authData,
      }));

      debugPrint('WebSocketService: Authentication sent');
    } catch (e) {
      debugPrint('WebSocketService: Authentication failed: $e');
      onError?.call('Authentication failed: $e');
    }
  }

  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message);
      final event = data['event'];
      final payload = data['data'];

      debugPrint('WebSocketService: Received event: $event');

      switch (event) {
        case 'authenticated':
          _isAuthenticated = true;
          debugPrint('WebSocketService: Authenticated successfully');
          break;

        case 'auth_error':
          _isAuthenticated = false;
          onError?.call('Authentication error: ${payload['message']}');
          break;

        case 'location_updated':
          onLocationUpdateResponse?.call(payload);
          break;

        case 'alert_created':
          onPanicAlertResponse?.call(payload);
          break;

        case 'alert_status_updated':
          onAlertStatusUpdate?.call(payload);
          break;

        case 'heartbeat':
          // Respond to heartbeat
          _sendHeartbeat();
          break;

        default:
          debugPrint('WebSocketService: Unknown event: $event');
      }
    } catch (e) {
      debugPrint('WebSocketService: Error parsing message: $e');
    }
  }

  void _handleError(error) {
    debugPrint('WebSocketService: WebSocket error: $error');
    onError?.call('WebSocket error: $error');
    _handleDisconnect();
  }

  void _handleDisconnect() {
    debugPrint('WebSocketService: Disconnected');
    _isConnected = false;
    _isAuthenticated = false;
    onConnectionStatusChanged?.call(false);
    
    _stopHeartbeat();
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_reconnectTimer != null) return;
    
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      _reconnectTimer = null;
      if (!_isConnected) {
        debugPrint('WebSocketService: Attempting to reconnect...');
        connect();
      }
    });
  }

  void _startHeartbeat() {
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_isConnected && _isAuthenticated) {
        _sendHeartbeat();
      }
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void _sendHeartbeat() {
    if (_isConnected && _isAuthenticated) {
      _channel!.sink.add(jsonEncode({
        'event': 'heartbeat',
        'data': {
          'timestamp': DateTime.now().toIso8601String(),
          'userId': _userId,
        },
      }));
    }
  }

  Future<void> sendLocationUpdate(LocationData locationData) async {
    if (!_isConnected || !_isAuthenticated) {
      debugPrint('WebSocketService: Not connected or authenticated');
      return;
    }

    try {
      final message = {
        'event': 'location_update',
        'data': {
          'userId': _userId,
          ...locationData.toJson(),
        },
      };

      _channel!.sink.add(jsonEncode(message));
      debugPrint('WebSocketService: Location update sent');
    } catch (e) {
      debugPrint('WebSocketService: Error sending location update: $e');
      onError?.call('Failed to send location update: $e');
    }
  }

  Future<void> sendPanicAlert({
    required LocationData locationData,
    String? description,
    Map<String, dynamic>? deviceInfo,
    Map<String, dynamic>? networkInfo,
  }) async {
    if (!_isConnected || !_isAuthenticated) {
      debugPrint('WebSocketService: Not connected or authenticated');
      return;
    }

    try {
      final message = {
        'event': 'panic_alert',
        'data': {
          'userId': _userId,
          'latitude': locationData.latitude,
          'longitude': locationData.longitude,
          'accuracy': locationData.accuracy,
          'alertType': 'panic_button',
          'description': description ?? '',
          'deviceInfo': deviceInfo ?? {},
          'networkInfo': networkInfo ?? {},
          'timestamp': DateTime.now().toIso8601String(),
        },
      };

      _channel!.sink.add(jsonEncode(message));
      debugPrint('WebSocketService: Panic alert sent');
    } catch (e) {
      debugPrint('WebSocketService: Error sending panic alert: $e');
      onError?.call('Failed to send panic alert: $e');
    }
    }
  }

  Future<void> disconnect() async {
    debugPrint('WebSocketService: Disconnecting...');
    
    _stopHeartbeat();
    _reconnectTimer?.cancel();
    
    if (_channel != null) {
      await _channel!.sink.close(status.goingAway);
      _channel = null;
    }
    
    _isConnected = false;
    _isAuthenticated = false;
    onConnectionStatusChanged?.call(false);
    
    debugPrint('WebSocketService: Disconnected');
  }

  // HTTP API methods for fallback
  Future<Map<String, dynamic>> sendLocationUpdateHttp(LocationData locationData) async {
    try {
      final client = HttpClient();
      final request = await client.postUrl(Uri.parse('$_serverUrl/api/location/update'));
      
      request.headers.set('Content-Type', 'application/json');
      
      final body = {
        'userId': _userId,
        ...locationData.toJson(),
      };
      
      request.write(jsonEncode(body));
      final response = await request.close();
      
      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        return jsonDecode(responseBody);
      } else {
        throw Exception('HTTP ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('WebSocketService: HTTP location update failed: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> sendPanicAlertHttp({
    required LocationData locationData,
    String? description,
    Map<String, dynamic>? deviceInfo,
    Map<String, dynamic>? networkInfo,
  }) async {
    try {
      final client = HttpClient();
      final request = await client.postUrl(Uri.parse('$_serverUrl/api/alert/panic'));
      
      request.headers.set('Content-Type', 'application/json');
      
      final body = {
        'userId': _userId,
        'latitude': locationData.latitude,
        'longitude': locationData.longitude,
        'accuracy': locationData.accuracy,
        'alertType': 'panic_button',
        'description': description ?? '',
        'deviceInfo': deviceInfo ?? {},
        'networkInfo': networkInfo ?? {},
      };
      
      request.write(jsonEncode(body));
      final response = await request.close();
      
      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        return jsonDecode(responseBody);
      } else {
        throw Exception('HTTP ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('WebSocketService: HTTP panic alert failed: $e');
      rethrow;
    }
  }
}

