import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../utils/constants.dart';
import 'auth_service.dart';

enum WebSocketConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error
}

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  static WebSocketService get instance => _instance;
  WebSocketService._internal();

  // WebSocket connections
  WebSocketChannel? _alertsChannel;
  WebSocketChannel? _userChannel;
  WebSocketChannel? _locationChannel;
  WebSocketChannel? _chatChannel;

  // Connection state
  WebSocketConnectionState _connectionState =
      WebSocketConnectionState.disconnected;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const int _reconnectDelaySeconds = 5;
  static const int _heartbeatIntervalSeconds = 30;

  // Stream controllers for different message types
  final StreamController<Map<String, dynamic>> _alertUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _operatorMessageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _locationUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _chatMessageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<WebSocketConnectionState> _connectionStateController =
      StreamController<WebSocketConnectionState>.broadcast();

  // Getters
  WebSocketConnectionState get connectionState => _connectionState;
  bool get isConnected =>
      _connectionState == WebSocketConnectionState.connected;

  // Stream getters
  Stream<Map<String, dynamic>> get alertUpdates =>
      _alertUpdateController.stream;
  Stream<Map<String, dynamic>> get operatorMessages =>
      _operatorMessageController.stream;
  Stream<Map<String, dynamic>> get locationUpdates =>
      _locationUpdateController.stream;
  Stream<Map<String, dynamic>> get chatMessages =>
      _chatMessageController.stream;
  Stream<WebSocketConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  /// Initialize WebSocket connections
  Future<void> initialize() async {
    try {
      if (!AuthService.instance.isLoggedIn) {
        debugPrint('WebSocketService: Cannot initialize - user not logged in');
        return;
      }

      debugPrint('WebSocketService: Initializing...');
      await _connectUserChannel();
      _startHeartbeat();
    } catch (e) {
      debugPrint('WebSocketService: Initialization failed: $e');
      _setConnectionState(WebSocketConnectionState.error);
    }
  }

  /// Connect to user-specific WebSocket channel
  Future<void> _connectUserChannel() async {
    if (_userChannel != null) return;

    try {
      _setConnectionState(WebSocketConnectionState.connecting);

      final user = AuthService.instance.currentUser;
      if (user == null) throw Exception('No current user');

      final token = await AuthService.instance.getAccessToken();
      if (token == null) throw Exception('No access token');

      final uri = Uri.parse('${AppConstants.wsBaseUrl}/ws/user/${user['id']}/')
          .replace(queryParameters: {'token': token});

      _userChannel = WebSocketChannel.connect(uri);
      _setConnectionState(WebSocketConnectionState.connected);
      _reconnectAttempts = 0;

      // Listen for messages
      _userChannel!.stream.listen(
        (message) => _handleUserMessage(message),
        onError: (error) => _handleConnectionError(error),
        onDone: () => _handleConnectionClosed(),
      );

      debugPrint('WebSocketService: User channel connected');
    } catch (e) {
      debugPrint('WebSocketService: Failed to connect user channel: $e');
      _setConnectionState(WebSocketConnectionState.error);
      _scheduleReconnect();
    }
  }

  /// Connect to alert-specific WebSocket channel
  Future<void> connectToAlert(String alertId) async {
    try {
      await _disconnectAlertChannel();

      final token = await AuthService.instance.getAccessToken();
      if (token == null) throw Exception('No access token');

      final uri = Uri.parse('${AppConstants.wsBaseUrl}/ws/alerts/$alertId/')
          .replace(queryParameters: {'token': token});

      _alertsChannel = WebSocketChannel.connect(uri);

      // Listen for alert-specific messages
      _alertsChannel!.stream.listen(
        (message) => _handleAlertMessage(message),
        onError: (error) => debugPrint('Alert WebSocket error: $error'),
        onDone: () => debugPrint('Alert WebSocket closed'),
      );

      debugPrint('WebSocketService: Connected to alert $alertId');
    } catch (e) {
      debugPrint('WebSocketService: Failed to connect to alert: $e');
    }
  }

  /// Connect to location tracking WebSocket
  Future<void> connectToLocation(String alertId) async {
    try {
      await _disconnectLocationChannel();

      final token = await AuthService.instance.getAccessToken();
      if (token == null) throw Exception('No access token');

      final uri = Uri.parse('${AppConstants.wsBaseUrl}/ws/location/$alertId/')
          .replace(queryParameters: {'token': token});

      _locationChannel = WebSocketChannel.connect(uri);

      // Listen for location messages
      _locationChannel!.stream.listen(
        (message) => _handleLocationMessage(message),
        onError: (error) => debugPrint('Location WebSocket error: $error'),
        onDone: () => debugPrint('Location WebSocket closed'),
      );

      debugPrint(
          'WebSocketService: Connected to location tracking for $alertId');
    } catch (e) {
      debugPrint('WebSocketService: Failed to connect to location: $e');
    }
  }

  /// Connect to chat WebSocket
  Future<void> connectToChat(String alertId) async {
    try {
      await _disconnectChatChannel();

      final token = await AuthService.instance.getAccessToken();
      if (token == null) throw Exception('No access token');

      final uri = Uri.parse('${AppConstants.wsBaseUrl}/ws/chat/$alertId/')
          .replace(queryParameters: {'token': token});

      _chatChannel = WebSocketChannel.connect(uri);

      // Listen for chat messages
      _chatChannel!.stream.listen(
        (message) => _handleChatMessage(message),
        onError: (error) => debugPrint('Chat WebSocket error: $error'),
        onDone: () => debugPrint('Chat WebSocket closed'),
      );

      debugPrint('WebSocketService: Connected to chat for $alertId');
    } catch (e) {
      debugPrint('WebSocketService: Failed to connect to chat: $e');
    }
  }

  /// Send location update
  Future<void> sendLocationUpdate(
      String alertId, Map<String, dynamic> location) async {
    if (_locationChannel == null) {
      await connectToLocation(alertId);
    }

    try {
      final message = {
        'type': 'location_update',
        'location': location,
        'timestamp': DateTime.now().toIso8601String(),
      };

      _locationChannel?.sink.add(json.encode(message));
      debugPrint('WebSocketService: Location update sent');
    } catch (e) {
      debugPrint('WebSocketService: Failed to send location update: $e');
    }
  }

  /// Send chat message
  Future<void> sendChatMessage(String alertId, String message) async {
    if (_chatChannel == null) {
      await connectToChat(alertId);
    }

    try {
      final payload = {
        'type': 'chat_message',
        'message': message,
        'timestamp': DateTime.now().toIso8601String(),
      };

      _chatChannel?.sink.add(json.encode(payload));
      debugPrint('WebSocketService: Chat message sent');
    } catch (e) {
      debugPrint('WebSocketService: Failed to send chat message: $e');
    }
  }

  /// Cancel alert via WebSocket
  Future<void> cancelAlert(String alertId) async {
    if (_alertsChannel == null) {
      await connectToAlert(alertId);
    }

    try {
      final message = {
        'type': 'cancel_alert',
        'timestamp': DateTime.now().toIso8601String(),
      };

      _alertsChannel?.sink.add(json.encode(message));
      debugPrint('WebSocketService: Alert cancellation sent');
    } catch (e) {
      debugPrint('WebSocketService: Failed to send alert cancellation: $e');
    }
  }

  /// Handle user channel messages
  void _handleUserMessage(dynamic rawMessage) {
    try {
      final message = json.decode(rawMessage);
      final messageType = message['type'];

      debugPrint('WebSocketService: User message received: $messageType');

      switch (messageType) {
        case 'alert_status_update':
          _alertUpdateController.add(message);
          break;
        case 'operator_message':
          _operatorMessageController.add(message);
          break;
        case 'error':
          debugPrint('WebSocket error: ${message['message']}');
          break;
        default:
          debugPrint('Unknown user message type: $messageType');
      }
    } catch (e) {
      debugPrint('WebSocketService: Failed to handle user message: $e');
    }
  }

  /// Handle alert-specific messages
  void _handleAlertMessage(dynamic rawMessage) {
    try {
      final message = json.decode(rawMessage);
      final messageType = message['type'];

      debugPrint('WebSocketService: Alert message received: $messageType');

      switch (messageType) {
        case 'alert_status':
        case 'alert_updated':
          _alertUpdateController.add(message);
          break;
        case 'success':
          debugPrint('Alert WebSocket success: ${message['message']}');
          break;
        case 'error':
          debugPrint('Alert WebSocket error: ${message['message']}');
          break;
        default:
          debugPrint('Unknown alert message type: $messageType');
      }
    } catch (e) {
      debugPrint('WebSocketService: Failed to handle alert message: $e');
    }
  }

  /// Handle location tracking messages
  void _handleLocationMessage(dynamic rawMessage) {
    try {
      final message = json.decode(rawMessage);
      final messageType = message['type'];

      debugPrint('WebSocketService: Location message received: $messageType');

      switch (messageType) {
        case 'location_updated':
          _locationUpdateController.add(message);
          break;
        case 'success':
          debugPrint('Location WebSocket success: ${message['message']}');
          break;
        case 'error':
          debugPrint('Location WebSocket error: ${message['message']}');
          break;
        default:
          debugPrint('Unknown location message type: $messageType');
      }
    } catch (e) {
      debugPrint('WebSocketService: Failed to handle location message: $e');
    }
  }

  /// Handle chat messages
  void _handleChatMessage(dynamic rawMessage) {
    try {
      final message = json.decode(rawMessage);
      final messageType = message['type'];

      debugPrint('WebSocketService: Chat message received: $messageType');

      switch (messageType) {
        case 'chat_message':
          _chatMessageController.add(message);
          break;
        case 'error':
          debugPrint('Chat WebSocket error: ${message['message']}');
          break;
        default:
          debugPrint('Unknown chat message type: $messageType');
      }
    } catch (e) {
      debugPrint('WebSocketService: Failed to handle chat message: $e');
    }
  }

  /// Handle connection errors
  void _handleConnectionError(dynamic error) {
    debugPrint('WebSocketService: Connection error: $error');
    _setConnectionState(WebSocketConnectionState.error);
    _scheduleReconnect();
  }

  /// Handle connection closed
  void _handleConnectionClosed() {
    debugPrint('WebSocketService: Connection closed');
    _setConnectionState(WebSocketConnectionState.disconnected);
    _scheduleReconnect();
  }

  /// Schedule reconnection attempt
  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('WebSocketService: Max reconnect attempts reached');
      _setConnectionState(WebSocketConnectionState.error);
      return;
    }

    if (_reconnectTimer?.isActive == true) return;

    _reconnectAttempts++;
    _setConnectionState(WebSocketConnectionState.reconnecting);

    _reconnectTimer = Timer(
      Duration(seconds: _reconnectDelaySeconds * _reconnectAttempts),
      () async {
        debugPrint(
            'WebSocketService: Attempting reconnection ($_reconnectAttempts/$_maxReconnectAttempts)');
        await _reconnectUserChannel();
      },
    );
  }

  /// Reconnect user channel
  Future<void> _reconnectUserChannel() async {
    try {
      await _disconnectUserChannel();
      await _connectUserChannel();
    } catch (e) {
      debugPrint('WebSocketService: Reconnection failed: $e');
      _scheduleReconnect();
    }
  }

  /// Start heartbeat to keep connection alive
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(
      const Duration(seconds: _heartbeatIntervalSeconds),
      (_) => _sendHeartbeat(),
    );
  }

  /// Send heartbeat ping
  void _sendHeartbeat() {
    if (_userChannel != null && isConnected) {
      try {
        final heartbeat = {
          'type': 'ping',
          'timestamp': DateTime.now().toIso8601String(),
        };
        _userChannel!.sink.add(json.encode(heartbeat));
      } catch (e) {
        debugPrint('WebSocketService: Failed to send heartbeat: $e');
      }
    }
  }

  /// Set connection state and notify listeners
  void _setConnectionState(WebSocketConnectionState state) {
    if (_connectionState != state) {
      _connectionState = state;
      _connectionStateController.add(state);
      debugPrint('WebSocketService: Connection state changed to $state');
    }
  }

  /// Disconnect user channel
  Future<void> _disconnectUserChannel() async {
    try {
      await _userChannel?.sink.close(status.normalClosure);
      _userChannel = null;
    } catch (e) {
      debugPrint('WebSocketService: Error disconnecting user channel: $e');
    }
  }

  /// Disconnect alert channel
  Future<void> _disconnectAlertChannel() async {
    try {
      await _alertsChannel?.sink.close(status.normalClosure);
      _alertsChannel = null;
    } catch (e) {
      debugPrint('WebSocketService: Error disconnecting alert channel: $e');
    }
  }

  /// Disconnect location channel
  Future<void> _disconnectLocationChannel() async {
    try {
      await _locationChannel?.sink.close(status.normalClosure);
      _locationChannel = null;
    } catch (e) {
      debugPrint('WebSocketService: Error disconnecting location channel: $e');
    }
  }

  /// Disconnect chat channel
  Future<void> _disconnectChatChannel() async {
    try {
      await _chatChannel?.sink.close(status.normalClosure);
      _chatChannel = null;
    } catch (e) {
      debugPrint('WebSocketService: Error disconnecting chat channel: $e');
    }
  }

  /// Disconnect all WebSocket connections
  Future<void> disconnect() async {
    debugPrint('WebSocketService: Disconnecting all channels...');

    _reconnectTimer?.cancel();
    _heartbeatTimer?.cancel();

    await Future.wait([
      _disconnectUserChannel(),
      _disconnectAlertChannel(),
      _disconnectLocationChannel(),
      _disconnectChatChannel(),
    ]);

    _setConnectionState(WebSocketConnectionState.disconnected);
    _reconnectAttempts = 0;
  }

  /// Dispose of the service
  void dispose() {
    disconnect();

    _alertUpdateController.close();
    _operatorMessageController.close();
    _locationUpdateController.close();
    _chatMessageController.close();
    _connectionStateController.close();

    debugPrint('WebSocketService: Disposed');
  }
}
