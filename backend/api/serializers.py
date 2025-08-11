from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Incident, IncidentUpdate

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 
                 'profile_picture', 'is_operator', 'is_emergency_responder', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password')

class IncidentSerializer(serializers.ModelSerializer):
    """Serializer for Incident model"""
    user = UserSerializer(read_only=True)
    updates = serializers.SerializerMethodField()
    
    class Meta:
        model = Incident
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_updates(self, obj):
        return IncidentUpdateSerializer(obj.updates.all(), many=True).data

class IncidentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for IncidentUpdate model"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = IncidentUpdate
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class IncidentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating incidents"""
    class Meta:
        model = Incident
        fields = ['title', 'description', 'incident_type', 'priority', 'latitude', 'longitude', 'address']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
