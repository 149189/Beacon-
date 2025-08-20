import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';
import 'auth_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  static ApiService get instance => _instance;
  ApiService._internal();

  Uri _buildUri(String endpoint, [Map<String, dynamic>? query]) {
    final base = AppConstants.baseUrl.endsWith('/')
        ? AppConstants.baseUrl.substring(0, AppConstants.baseUrl.length - 1)
        : AppConstants.baseUrl;
    final path = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return Uri.parse('$base$path').replace(queryParameters: query);
  }

  Future<Map<String, String>> _headers() async {
    final token = await AuthService.instance.getAccessToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> get(String endpoint, [Map<String, dynamic>? query]) async {
    try {
      final uri = _buildUri(endpoint, query);
      final headers = await _headers();
      final response = await http.get(uri, headers: headers);
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        debugPrint('API GET error: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('API GET exception: $e');
      return null;
    }
  }

  Future<dynamic> post(String endpoint, {Map<String, dynamic>? data}) async {
    try {
      final uri = _buildUri(endpoint);
      final headers = await _headers();
      final body = data != null ? json.encode(data) : null;
      final response = await http.post(uri, headers: headers, body: body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else {
        debugPrint('API POST error: ${response.statusCode} - ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('API POST exception: $e');
      return null;
    }
  }
}
