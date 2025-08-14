from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
import ipaddress

from .models import UserProfile, Message, UserActivity, SystemNotification
from .serializers import (
    UserSerializer, UserProfileSerializer, MessageSerializer, MessageCreateSerializer,
    MessageUpdateSerializer, UserActivitySerializer, SystemNotificationSerializer,
    UserRegistrationSerializer, UserLoginSerializer, ChangePasswordSerializer,
    DashboardStatsSerializer
)

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if user:
                # Update last seen and online status
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.set_online_status(True)
                profile.update_last_seen()
                
                # Log activity
                UserActivity.objects.create(
                    user=user,
                    activity_type='login',
                    description=f'User {username} logged in',
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                return Response({
                    'success': True,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    },
                    'user': UserSerializer(user).data,
                    'profile': UserProfileSerializer(profile).data
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class UserLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Update online status
            profile = request.user.profile
            profile.set_online_status(False)
            profile.update_last_seen()
            
            # Log activity
            UserActivity.objects.create(
                user=request.user,
                activity_type='logout',
                description=f'User {request.user.username} logged out',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'success': True, 'message': 'Logged out successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.profile

class UserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = UserProfile.objects.select_related('user').all()
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by online status
        online_only = self.request.query_params.get('online_only', None)
        if online_only == 'true':
            queryset = queryset.filter(is_online=True)
        
        # Search by username or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )
        
        return queryset

class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            # Admins can see all messages
            return Message.objects.select_related('user').all()
        else:
            # Regular users can only see their own messages
            return Message.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer
    
    def perform_create(self, serializer):
        message = serializer.save(user=self.request.user)
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            activity_type='message_sent',
            description=f'Message sent: {message.subject}',
            ip_address=self.get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Message.objects.select_related('user').all()
        else:
            return Message.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MessageUpdateSerializer
        return MessageSerializer
    
    def perform_update(self, serializer):
        message = serializer.save()
        
        # Mark as read if admin is updating
        if self.request.user.is_staff and not message.is_read:
            message.mark_as_read()
        
        # Log activity for admins
        if self.request.user.is_staff:
            UserActivity.objects.create(
                user=self.request.user,
                activity_type='message_sent',
                description=f'Message updated: {message.subject}',
                ip_address=self.get_client_ip(self.request),
                user_agent=self.request.META.get('HTTP_USER_AGENT', '')
            )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Calculate statistics
        total_users = User.objects.count()
        active_users = UserProfile.objects.filter(is_online=True).count()
        total_messages = Message.objects.count()
        unread_messages = Message.objects.filter(is_read=False).count()
        messages_today = Message.objects.filter(created_at__date=today).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        system_notifications = SystemNotification.objects.filter(is_active=True).count()
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'total_messages': total_messages,
            'unread_messages': unread_messages,
            'messages_today': messages_today,
            'new_users_today': new_users_today,
            'system_notifications': system_notifications
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

class UserActivityListView(generics.ListAPIView):
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return UserActivity.objects.select_related('user').all()
        else:
            return UserActivity.objects.filter(user=self.request.user)

class SystemNotificationListView(generics.ListAPIView):
    serializer_class = SystemNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SystemNotification.objects.filter(
            Q(is_active=True) &
            (Q(show_to_all=True) | Q(target_users=self.request.user)) &
            (Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_message_read(request, message_id):
    try:
        message = get_object_or_404(Message, id=message_id)
        
        # Check permissions
        if not request.user.is_staff and message.user != request.user:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        message.mark_as_read()
        return Response({'success': True, 'message': 'Message marked as read'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resolve_message(request, message_id):
    if not request.user.is_staff:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        message = get_object_or_404(Message, id=message_id)
        message.resolve_message()
        return Response({'success': True, 'message': 'Message resolved'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)