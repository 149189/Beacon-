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

from .models import (
    UserProfile, Message, UserActivity, SystemNotification,
    PanicAlert, AlertLocation, AlertMedia, EmergencyContact, AlertNotification
)
from .serializers import (
    UserSerializer, UserProfileSerializer, MessageSerializer, MessageCreateSerializer,
    MessageUpdateSerializer, UserActivitySerializer, SystemNotificationSerializer,
    UserRegistrationSerializer, UserLoginSerializer, ChangePasswordSerializer,
    DashboardStatsSerializer,
    # Panic Alert Serializers
    PanicAlertSerializer, PanicAlertListSerializer, PanicAlertCreateSerializer,
    PanicAlertUpdateSerializer, AlertLocationSerializer, AlertLocationCreateSerializer,
    AlertMediaSerializer, AlertMediaCreateSerializer, EmergencyContactSerializer,
    AlertNotificationSerializer, PanicAlertStatsSerializer
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
        
        # Panic alert statistics
        total_alerts = PanicAlert.objects.count()
        active_alerts = PanicAlert.objects.filter(
            status__in=['active', 'acknowledged', 'responding']
        ).count()
        alerts_today = PanicAlert.objects.filter(created_at__date=today).count()
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'total_messages': total_messages,
            'unread_messages': unread_messages,
            'messages_today': messages_today,
            'new_users_today': new_users_today,
            'system_notifications': system_notifications,
            'total_alerts': total_alerts,
            'active_alerts': active_alerts,
            'alerts_today': alerts_today
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


# ======================== PANIC ALERT VIEWS ========================

class PanicAlertListView(generics.ListCreateAPIView):
    """List all panic alerts or create a new one"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            # Admins can see all alerts
            queryset = PanicAlert.objects.select_related('user', 'assigned_operator').all()
        else:
            # Regular users can only see their own alerts
            queryset = PanicAlert.objects.filter(user=self.request.user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter active alerts only
        active_only = self.request.query_params.get('active_only', None)
        if active_only == 'true':
            queryset = queryset.filter(status__in=['active', 'acknowledged', 'responding'])
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PanicAlertCreateSerializer
        return PanicAlertListSerializer
    
    def perform_create(self, serializer):
        alert = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            activity_type='panic_alert',
            description=f'Panic alert created: {alert.get_alert_type_display()}',
            ip_address=self.get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Broadcast new alert to admin dashboard via WebSocket
        from .consumers import broadcast_new_panic_alert
        alert_data = PanicAlertListSerializer(alert).data
        broadcast_new_panic_alert(alert_data)
        
        return Response({
            'success': True,
            'alert_id': str(alert.id),
            'message': 'Panic alert created successfully'
        }, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class PanicAlertDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a specific panic alert"""
    serializer_class = PanicAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PanicAlert.objects.select_related('user', 'assigned_operator').prefetch_related(
                'location_history', 'media_files', 'notifications'
            ).all()
        else:
            return PanicAlert.objects.filter(user=self.request.user).prefetch_related(
                'location_history', 'media_files', 'notifications'
            )
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH'] and self.request.user.is_staff:
            return PanicAlertUpdateSerializer
        return PanicAlertSerializer
    
    def perform_update(self, serializer):
        alert = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            activity_type='panic_alert',
            description=f'Panic alert updated: {alert.id} - Status: {alert.get_status_display()}',
            ip_address=self.get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # TODO: Trigger real-time notifications to admin panel
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class AlertLocationListView(generics.ListCreateAPIView):
    """List or create location updates for a panic alert"""
    serializer_class = AlertLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        alert_id = self.kwargs['alert_id']
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        # Check permissions
        if not self.request.user.is_staff and alert.user != self.request.user:
            return AlertLocation.objects.none()
        
        return alert.location_history.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AlertLocationCreateSerializer
        return AlertLocationSerializer
    
    def perform_create(self, serializer):
        alert_id = self.kwargs['alert_id']
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        # Check permissions
        if alert.user != self.request.user:
            raise permissions.PermissionDenied("You can only update your own alerts")
        
        location = serializer.save(alert=alert)
        
        # Update the main alert's location if this is the most recent
        alert.latitude = location.latitude
        alert.longitude = location.longitude
        alert.location_accuracy = location.accuracy
        alert.save(update_fields=['latitude', 'longitude', 'location_accuracy', 'updated_at'])

class AlertMediaListView(generics.ListCreateAPIView):
    """List or upload media files for a panic alert"""
    serializer_class = AlertMediaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        alert_id = self.kwargs['alert_id']
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        # Check permissions
        if not self.request.user.is_staff and alert.user != self.request.user:
            return AlertMedia.objects.none()
        
        return alert.media_files.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AlertMediaCreateSerializer
        return AlertMediaSerializer
    
    def perform_create(self, serializer):
        alert_id = self.kwargs['alert_id']
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        # Check permissions
        if alert.user != self.request.user:
            raise permissions.PermissionDenied("You can only upload media to your own alerts")
        
        serializer.save(alert=alert)

class EmergencyContactListView(generics.ListCreateAPIView):
    """List or create emergency contacts for the authenticated user"""
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EmergencyContact.objects.filter(
            user=self.request.user, is_active=True
        ).order_by('relationship', 'name')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EmergencyContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete an emergency contact"""
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)

class PanicAlertStatsView(APIView):
    """Get panic alert statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Calculate statistics
        total_alerts = PanicAlert.objects.count()
        active_alerts = PanicAlert.objects.filter(
            status__in=['active', 'acknowledged', 'responding']
        ).count()
        acknowledged_alerts = PanicAlert.objects.filter(status='acknowledged').count()
        resolved_alerts = PanicAlert.objects.filter(status='resolved').count()
        alerts_today = PanicAlert.objects.filter(created_at__date=today).count()
        alerts_this_week = PanicAlert.objects.filter(created_at__date__gte=week_ago).count()
        alerts_this_month = PanicAlert.objects.filter(created_at__date__gte=month_ago).count()
        
        # Calculate average response time
        acknowledged_alerts_with_time = PanicAlert.objects.filter(
            status__in=['acknowledged', 'resolved'],
            acknowledged_at__isnull=False
        )
        
        if acknowledged_alerts_with_time.exists():
            total_response_time = sum([
                (alert.acknowledged_at - alert.created_at).total_seconds()
                for alert in acknowledged_alerts_with_time
            ])
            average_response_time = total_response_time / acknowledged_alerts_with_time.count()
        else:
            average_response_time = 0
        
        # Alert types breakdown
        alert_types = PanicAlert.objects.values('alert_type').annotate(
            count=Count('alert_type')
        )
        alert_types_breakdown = {item['alert_type']: item['count'] for item in alert_types}
        
        # Priority breakdown
        priorities = PanicAlert.objects.values('priority').annotate(
            count=Count('priority')
        )
        priority_breakdown = {str(item['priority']): item['count'] for item in priorities}
        
        stats = {
            'total_alerts': total_alerts,
            'active_alerts': active_alerts,
            'acknowledged_alerts': acknowledged_alerts,
            'resolved_alerts': resolved_alerts,
            'alerts_today': alerts_today,
            'alerts_this_week': alerts_this_week,
            'alerts_this_month': alerts_this_month,
            'average_response_time': average_response_time,
            'alert_types_breakdown': alert_types_breakdown,
            'priority_breakdown': priority_breakdown
        }
        
        serializer = PanicAlertStatsSerializer(stats)
        return Response(serializer.data)

# ======================== PANIC ALERT ENDPOINTS FOR API ========================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_alerts_for_map(request):
    """Get active alerts with location data for map display"""
    if not request.user.is_staff:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        alerts = PanicAlert.objects.filter(
            status__in=['active', 'acknowledged', 'responding'],
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('user', 'assigned_operator')
        
        alerts_data = []
        for alert in alerts:
            alert_data = {
                'id': str(alert.id),
                'user': alert.user.username,
                'status': alert.status,
                'alert_type': alert.alert_type,
                'priority': alert.priority,
                'latitude': float(alert.latitude),
                'longitude': float(alert.longitude),
                'accuracy': alert.location_accuracy,
                'address': alert.address,
                'created_at': alert.created_at.isoformat(),
                'updated_at': alert.updated_at.isoformat(),
                'assigned_operator': alert.assigned_operator.username if alert.assigned_operator else None,
                'duration_seconds': (timezone.now() - alert.created_at).total_seconds()
            }
            alerts_data.append(alert_data)
        
        return Response({
            'success': True,
            'alerts': alerts_data,
            'count': len(alerts_data)
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_panic_alert(request):
    """Create a new panic alert from mobile app"""
    try:
        # Get location data
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not latitude or not longitude:
            return Response({
                'error': 'Location data (latitude and longitude) is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create panic alert
        alert = PanicAlert.objects.create(
            user=request.user,
            alert_type=request.data.get('alert_type', 'panic_button'),
            priority=request.data.get('priority', 4),
            latitude=latitude,
            longitude=longitude,
            location_accuracy=request.data.get('accuracy', 0),
            address=request.data.get('address', ''),
            description=request.data.get('description', ''),
            is_silent=request.data.get('is_silent', False),
            device_info=request.data.get('device_info', {}),
            network_info=request.data.get('network_info', {})
        )
        
        # Create initial location record
        AlertLocation.objects.create(
            alert=alert,
            latitude=latitude,
            longitude=longitude,
            accuracy=request.data.get('accuracy', 0),
            altitude=request.data.get('altitude'),
            speed=request.data.get('speed'),
            heading=request.data.get('heading'),
            provider=request.data.get('provider', 'gps'),
            battery_level=request.data.get('battery_level')
        )
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='panic_alert',
            description=f'Panic alert created: {alert.get_alert_type_display()}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Broadcast new alert to admin dashboard via WebSocket
        alert_data = PanicAlertListSerializer(alert).data
        broadcast_new_panic_alert(alert_data)
        broadcast_map_alert_update(alert_data)
        
        return Response({
            'success': True,
            'alert_id': str(alert.id),
            'message': 'Panic alert created successfully',
            'alert': alert_data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ======================== PANIC ALERT ACTION ENDPOINTS ========================

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def acknowledge_alert(request, alert_id):
    """Acknowledge a panic alert (operator action)"""
    if not request.user.is_staff:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        if alert.status != 'active':
            return Response(
                {'error': 'Alert can only be acknowledged if it is active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.acknowledge(request.user)
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='panic_alert',
            description=f'Panic alert acknowledged: {alert.id}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # TODO: Send real-time update to admin panel and mobile app
        
        return Response({
            'success': True,
            'message': 'Alert acknowledged successfully',
            'alert': PanicAlertListSerializer(alert).data
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resolve_alert(request, alert_id):
    """Resolve a panic alert (operator action)"""
    if not request.user.is_staff:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        if not alert.is_active:
            return Response(
                {'error': 'Alert is already resolved or cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resolution_notes = request.data.get('notes', '')
        alert.resolve(resolution_notes)
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='panic_alert',
            description=f'Panic alert resolved: {alert.id}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # TODO: Send real-time update to admin panel and mobile app
        
        return Response({
            'success': True,
            'message': 'Alert resolved successfully',
            'alert': PanicAlertListSerializer(alert).data
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_alert(request, alert_id):
    """Cancel a panic alert (user action)"""
    try:
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        # Check permissions - only the user who created the alert can cancel it
        if alert.user != request.user:
            return Response(
                {'error': 'You can only cancel your own alerts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not alert.is_active:
            return Response(
                {'error': 'Alert is already resolved or cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.cancel()
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='panic_alert',
            description=f'Panic alert cancelled: {alert.id}',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # TODO: Send real-time update to admin panel
        
        return Response({
            'success': True,
            'message': 'Alert cancelled successfully',
            'alert': PanicAlertListSerializer(alert).data
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_alert_location(request, alert_id):
    """Update location for an active panic alert"""
    try:
        alert = get_object_or_404(PanicAlert, id=alert_id)
        
        # Check permissions
        if alert.user != request.user:
            return Response(
                {'error': 'You can only update your own alerts'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not alert.is_active:
            return Response(
                {'error': 'Cannot update location for inactive alerts'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AlertLocationCreateSerializer(data=request.data)
        if serializer.is_valid():
            location = serializer.save(alert=alert)
            
            # Update the main alert's location
            alert.latitude = location.latitude
            alert.longitude = location.longitude
            alert.location_accuracy = location.accuracy
            alert.save(update_fields=['latitude', 'longitude', 'location_accuracy', 'updated_at'])
            
            # TODO: Send real-time location update to admin panel
            
            return Response({
                'success': True,
                'message': 'Location updated successfully',
                'location': AlertLocationSerializer(location).data
            })
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
