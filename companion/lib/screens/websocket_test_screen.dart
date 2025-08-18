import 'package:flutter/material.dart';
import '../services/websocket_service.dart';
import '../services/panic_service.dart';
import '../services/auth_service.dart';
import '../utils/constants.dart';

class WebSocketTestScreen extends StatefulWidget {
  const WebSocketTestScreen({super.key});

  @override
  State<WebSocketTestScreen> createState() => _WebSocketTestScreenState();
}

class _WebSocketTestScreenState extends State<WebSocketTestScreen> {
  final TextEditingController _messageController = TextEditingController();
  final List<String> _messages = [];
  WebSocketConnectionState _connectionState =
      WebSocketConnectionState.disconnected;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _initializeServices() async {
    try {
      // Initialize services
      await PanicService.instance.initialize();

      // Listen to connection state changes
      WebSocketService.instance.connectionStateStream.listen((state) {
        setState(() {
          _connectionState = state;
        });
        _addMessage('Connection state: ${state.name}');
      });

      // Listen to alert updates
      WebSocketService.instance.alertUpdates.listen((message) {
        _addMessage('Alert Update: ${message.toString()}');
      });

      // Listen to operator messages
      WebSocketService.instance.operatorMessages.listen((message) {
        _addMessage('Operator: ${message['message'] ?? 'Unknown message'}');
      });

      // Listen to location updates
      WebSocketService.instance.locationUpdates.listen((message) {
        _addMessage('Location Update: ${message.toString()}');
      });

      // Listen to chat messages
      WebSocketService.instance.chatMessages.listen((message) {
        _addMessage('Chat: ${message['message'] ?? 'Unknown chat message'}');
      });

      setState(() {
        _isInitialized = true;
      });

      _addMessage('WebSocket test initialized');
    } catch (e) {
      _addMessage('Initialization error: $e');
    }
  }

  void _addMessage(String message) {
    setState(() {
      _messages.add('${DateTime.now().toString().substring(11, 19)}: $message');
    });
    // Auto-scroll to bottom
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_messages.isNotEmpty) {
        // Scroll to bottom logic would go here if we had a scroll controller
      }
    });
  }

  Future<void> _connectWebSocket() async {
    try {
      if (!AuthService.instance.isLoggedIn) {
        _addMessage('Error: User not logged in');
        return;
      }

      await WebSocketService.instance.initialize();
      _addMessage('WebSocket connection initiated');
    } catch (e) {
      _addMessage('Connection error: $e');
    }
  }

  Future<void> _disconnectWebSocket() async {
    try {
      await WebSocketService.instance.disconnect();
      _addMessage('WebSocket disconnected');
    } catch (e) {
      _addMessage('Disconnection error: $e');
    }
  }

  Future<void> _sendTestMessage() async {
    try {
      if (_messageController.text.trim().isEmpty) return;

      // Test sending a chat message (requires active alert)
      if (PanicService.instance.hasActiveAlert) {
        await PanicService.instance
            .sendChatMessage(_messageController.text.trim());
        _addMessage('Sent: ${_messageController.text.trim()}');
      } else {
        _addMessage('No active alert to send chat message');
      }

      _messageController.clear();
    } catch (e) {
      _addMessage('Send error: $e');
    }
  }

  Future<void> _createTestAlert() async {
    try {
      final alert = await PanicService.instance.createPanicAlert(
        description: 'Test alert from WebSocket screen',
        priority: AppConstants.mediumPriority,
      );

      if (alert != null) {
        _addMessage('Test alert created: ${alert.id}');
        // Connect to the alert-specific channel
        await PanicService.instance.connectToAlertChannel(alert.id);
      }
    } catch (e) {
      _addMessage('Alert creation error: $e');
    }
  }

  Future<void> _cancelAlert() async {
    try {
      await PanicService.instance.cancelAlertViaWebSocket();
      _addMessage('Alert cancellation requested');
    } catch (e) {
      _addMessage('Cancel error: $e');
    }
  }

  Color _getConnectionColor() {
    switch (_connectionState) {
      case WebSocketConnectionState.connected:
        return Colors.green;
      case WebSocketConnectionState.connecting:
      case WebSocketConnectionState.reconnecting:
        return Colors.orange;
      case WebSocketConnectionState.error:
        return Colors.red;
      case WebSocketConnectionState.disconnected:
      default:
        return Colors.grey;
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('WebSocket Test'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: _getConnectionColor(),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Connection Status
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: _getConnectionColor().withOpacity(0.1),
            child: Text(
              'Status: ${_connectionState.name.toUpperCase()}',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: _getConnectionColor(),
              ),
              textAlign: TextAlign.center,
            ),
          ),

          // Control Buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton(
                  onPressed: _isInitialized ? _connectWebSocket : null,
                  child: const Text('Connect'),
                ),
                ElevatedButton(
                  onPressed: _isInitialized ? _disconnectWebSocket : null,
                  child: const Text('Disconnect'),
                ),
                ElevatedButton(
                  onPressed: _isInitialized ? _createTestAlert : null,
                  child: const Text('Create Alert'),
                ),
                ElevatedButton(
                  onPressed:
                      _isInitialized && PanicService.instance.hasActiveAlert
                          ? _cancelAlert
                          : null,
                  child: const Text('Cancel Alert'),
                ),
              ],
            ),
          ),

          // Message Input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Enter test message...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _sendTestMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isInitialized ? _sendTestMessage : null,
                  child: const Text('Send'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Messages List
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: _messages.isEmpty
                  ? const Center(
                      child: Text(
                        'No messages yet\nTap Connect to start',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: 16,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Text(
                            _messages[index],
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 12,
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
