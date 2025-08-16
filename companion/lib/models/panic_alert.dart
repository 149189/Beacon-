class PanicAlert {
  final String id;
  final String alertType;
  final String status;
  final int priority;
  final double latitude;
  final double longitude;
  final double locationAccuracy;
  final String address;
  final String description;
  final bool isSilent;
  final bool autoCallEmergency;
  final DateTime createdAt;
  final DateTime? acknowledgedAt;
  final DateTime? resolvedAt;
  final String? operatorId;
  final String? operatorName;
  final Map<String, dynamic>? deviceInfo;
  final Map<String, dynamic>? networkInfo;
  final List<String>? mediaUrls;
  final List<String>? emergencyContacts;

  const PanicAlert({
    required this.id,
    required this.alertType,
    required this.status,
    required this.priority,
    required this.latitude,
    required this.longitude,
    required this.locationAccuracy,
    required this.address,
    required this.description,
    required this.isSilent,
    required this.autoCallEmergency,
    required this.createdAt,
    this.acknowledgedAt,
    this.resolvedAt,
    this.operatorId,
    this.operatorName,
    this.deviceInfo,
    this.networkInfo,
    this.mediaUrls,
    this.emergencyContacts,
  });

  /// Check if alert is currently active
  bool get isActive {
    return status == 'active' || status == 'acknowledged' || status == 'responding';
  }

  /// Check if alert is resolved
  bool get isResolved {
    return status == 'resolved' || status == 'false_alarm' || status == 'canceled';
  }

  /// Get alert duration
  Duration get duration {
    final endTime = resolvedAt ?? DateTime.now();
    return endTime.difference(createdAt);
  }

  /// Create copy with updated fields
  PanicAlert copyWith({
    String? id,
    String? alertType,
    String? status,
    int? priority,
    double? latitude,
    double? longitude,
    double? locationAccuracy,
    String? address,
    String? description,
    bool? isSilent,
    bool? autoCallEmergency,
    DateTime? createdAt,
    DateTime? acknowledgedAt,
    DateTime? resolvedAt,
    String? operatorId,
    String? operatorName,
    Map<String, dynamic>? deviceInfo,
    Map<String, dynamic>? networkInfo,
    List<String>? mediaUrls,
    List<String>? emergencyContacts,
  }) {
    return PanicAlert(
      id: id ?? this.id,
      alertType: alertType ?? this.alertType,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationAccuracy: locationAccuracy ?? this.locationAccuracy,
      address: address ?? this.address,
      description: description ?? this.description,
      isSilent: isSilent ?? this.isSilent,
      autoCallEmergency: autoCallEmergency ?? this.autoCallEmergency,
      createdAt: createdAt ?? this.createdAt,
      acknowledgedAt: acknowledgedAt ?? this.acknowledgedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      operatorId: operatorId ?? this.operatorId,
      operatorName: operatorName ?? this.operatorName,
      deviceInfo: deviceInfo ?? this.deviceInfo,
      networkInfo: networkInfo ?? this.networkInfo,
      mediaUrls: mediaUrls ?? this.mediaUrls,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
    );
  }

  /// Create from JSON
  factory PanicAlert.fromJson(Map<String, dynamic> json) {
    return PanicAlert(
      id: json['id'].toString(),
      alertType: json['alert_type'] ?? 'unknown',
      status: json['status'] ?? 'unknown',
      priority: json['priority'] ?? 3,
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
      locationAccuracy: (json['location_accuracy'] ?? 0.0).toDouble(),
      address: json['address'] ?? '',
      description: json['description'] ?? '',
      isSilent: json['is_silent'] ?? false,
      autoCallEmergency: json['auto_call_emergency'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
      acknowledgedAt: json['acknowledged_at'] != null 
          ? DateTime.parse(json['acknowledged_at']) 
          : null,
      resolvedAt: json['resolved_at'] != null 
          ? DateTime.parse(json['resolved_at']) 
          : null,
      operatorId: json['operator_id'],
      operatorName: json['operator_name'],
      deviceInfo: json['device_info'],
      networkInfo: json['network_info'],
      mediaUrls: json['media_urls'] != null 
          ? List<String>.from(json['media_urls']) 
          : null,
      emergencyContacts: json['emergency_contacts'] != null 
          ? List<String>.from(json['emergency_contacts']) 
          : null,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'alert_type': alertType,
      'status': status,
      'priority': priority,
      'latitude': latitude,
      'longitude': longitude,
      'location_accuracy': locationAccuracy,
      'address': address,
      'description': description,
      'is_silent': isSilent,
      'auto_call_emergency': autoCallEmergency,
      'created_at': createdAt.toIso8601String(),
      'acknowledged_at': acknowledgedAt?.toIso8601String(),
      'resolved_at': resolvedAt?.toIso8601String(),
      'operator_id': operatorId,
      'operator_name': operatorName,
      'device_info': deviceInfo,
      'network_info': networkInfo,
      'media_urls': mediaUrls,
      'emergency_contacts': emergencyContacts,
    };
  }

  @override
  String toString() {
    return 'PanicAlert(id: $id, type: $alertType, status: $status, priority: $priority)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    
    return other is PanicAlert && 
        other.id == id &&
        other.alertType == alertType &&
        other.status == status &&
        other.priority == priority;
  }

  @override
  int get hashCode {
    return id.hashCode ^ 
        alertType.hashCode ^ 
        status.hashCode ^ 
        priority.hashCode;
  }
}
