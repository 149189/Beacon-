from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import connection
from django.db.utils import OperationalError
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from .models import User, Incident, IncidentUpdate
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    IncidentSerializer, IncidentUpdateSerializer, IncidentCreateSerializer
)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint for monitoring"""
    return Response({
        'status': 'healthy',
        'service': 'beacon-backend',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)

class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    """User profile management"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update user profile"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IncidentListView(generics.ListCreateAPIView):
    """List and create incidents"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IncidentSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_operator or user.is_emergency_responder:
            return Incident.objects.all()
        return Incident.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return IncidentCreateSerializer
        return IncidentSerializer

class IncidentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete incidents"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IncidentSerializer
    queryset = Incident.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_operator or user.is_emergency_responder:
            return Incident.objects.all()
        return Incident.objects.filter(user=user)

class IncidentUpdateView(generics.CreateAPIView):
    """Add updates to incidents"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IncidentUpdateSerializer
    
    def perform_create(self, serializer):
        incident_id = self.kwargs.get('incident_id')
        incident = Incident.objects.get(id=incident_id)
        serializer.save(incident=incident, user=self.request.user)

@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([permissions.AllowAny])
def test_incidents(request):
    """Test endpoint for incidents - no authentication required"""
    # Return some sample incident data for testing
    sample_incidents = [
        {
            'id': '1',
            'user': 'John Doe',
            'status': 'active',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'created_at': '2024-01-15T10:30:00Z',
            'description': 'Emergency situation in downtown area'
        },
        {
            'id': '2',
            'user': 'Jane Smith',
            'status': 'acknowledged',
            'latitude': 40.7589,
            'longitude': -73.9851,
            'created_at': '2024-01-15T09:15:00Z',
            'description': 'Medical emergency at Times Square'
        },
        {
            'id': '3',
            'user': 'Mike Johnson',
            'status': 'active',
            'latitude': 40.7505,
            'longitude': -73.9934,
            'created_at': '2024-01-15T11:00:00Z',
            'description': 'Fire alarm triggered in office building'
        }
    ]
    
    return Response(sample_incidents, status=status.HTTP_200_OK)
