from django.http import JsonResponse
from django.db import connection
from django.db.utils import OperationalError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.utils import timezone

@api_view(['GET'])
def health_check(request):
    """Health check endpoint for monitoring"""
    return Response({
        'status': 'healthy',
        'service': 'beacon-backend',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)

@csrf_exempt
@require_http_methods(["GET"])
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
    
    return JsonResponse(sample_incidents, safe=False)
