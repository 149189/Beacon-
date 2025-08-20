import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  static AuthService get instance => _instance;
  AuthService._internal();

  bool _initialized = false;
  Map<String, dynamic>? _currentUser;
  String? _accessToken;
  String? _refreshToken;

  bool get isInitialized => _initialized;
  bool get isLoggedIn => _accessToken != null && _accessToken!.isNotEmpty;
  bool get hasValidToken => isLoggedIn;
  Map<String, dynamic>? get currentUser => _currentUser;

  Future<void> initialize() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance().timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          debugPrint('AuthService: SharedPreferences timeout, using defaults');
          return SharedPreferences.getInstance();
        },
      );
      _accessToken = prefs.getString('access_token');
      _refreshToken = prefs.getString('refresh_token');
      final userStr = prefs.getString('current_user');
      if (userStr != null) {
        _currentUser = json.decode(userStr);
      }
      _initialized = true;
      debugPrint('AuthService: initialized');
    } catch (e) {
      debugPrint('AuthService: initialization failed: $e');
      // Set as initialized even if failed to prevent infinite retries
      _initialized = true;
    }
  }

  Future<String?> getAccessToken() async {
    if (!_initialized) await initialize();
    return _accessToken;
  }

  Future<void> login(String email, String password) async {
    // TODO: Implement actual login API call
    _accessToken = 'dummy_token_$email';
    _currentUser = {'id': 1, 'email': email, 'name': 'Test User'};
    await _saveToPrefs();
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    _currentUser = null;
    await _clearPrefs();
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_accessToken != null) {
        await prefs.setString('access_token', _accessToken!);
      }
      if (_refreshToken != null) {
        await prefs.setString('refresh_token', _refreshToken!);
      }
      if (_currentUser != null) {
        await prefs.setString('current_user', json.encode(_currentUser));
      }
    } catch (e) {
      debugPrint('AuthService: failed to save to prefs: $e');
    }
  }

  Future<void> _clearPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('access_token');
      await prefs.remove('refresh_token');
      await prefs.remove('current_user');
    } catch (e) {
      debugPrint('AuthService: failed to clear prefs: $e');
    }
  }
}
