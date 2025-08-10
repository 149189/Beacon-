from django.http import JsonResponse
from django.db import connection
from django.db.utils import OperationalError
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint to verify backend and database connectivity
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"
    except OperationalError:
        db_status = "disconnected"
    
    return Response({
        'message': f'Beacon Backend is running! Database: {db_status}',
        'status': 'healthy',
        'database': db_status
    })
