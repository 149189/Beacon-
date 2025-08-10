import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';

const MapView = ({ incidents, selectedIncidentId, onIncidentSelect }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markers = useRef({});
    const [mapLoaded, setMapLoaded] = useState(false);

    // Initialize map
    useEffect(() => {
        if (map.current) return; // Initialize map only once

        const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
        if (!mapboxToken) {
            console.error('Mapbox token not found. Please set REACT_APP_MAPBOX_TOKEN environment variable.');
            return;
        }

        mapboxgl.accessToken = mapboxToken;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-74.006, 40.7128], // Default to NYC, will be updated based on incidents
            zoom: 10
        });

        map.current.on('load', () => {
            setMapLoaded(true);
            updateMapCenter();
        });

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update map center based on incidents
    const updateMapCenter = () => {
        if (!map.current || !mapLoaded || incidents.length === 0) return;

        const bounds = new mapboxgl.LngLatBounds();
        
        incidents.forEach(incident => {
            bounds.extend([incident.longitude, incident.latitude]);
        });

        map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
        });
    };

    // Update markers when incidents change
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear existing markers
        Object.values(markers.current).forEach(marker => marker.remove());
        markers.current = {};

        // Add new markers
        incidents.forEach(incident => {
            const markerElement = createMarkerElement(incident);
            
            const marker = new mapboxgl.Marker(markerElement)
                .setLngLat([incident.longitude, incident.latitude])
                .addTo(map.current);

            // Store marker reference
            markers.current[incident.id] = marker;

            // Add click event
            markerElement.addEventListener('click', () => {
                onIncidentSelect(incident);
            });
        });

        // Update map center if no incidents were previously shown
        if (Object.keys(markers.current).length > 0) {
            updateMapCenter();
        }
    }, [incidents, mapLoaded, onIncidentSelect]);

    // Update selected incident marker
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Reset all markers to default style
        Object.values(markers.current).forEach(marker => {
            const element = marker.getElement();
            element.classList.remove('selected');
        });

        // Highlight selected incident marker
        if (selectedIncidentId && markers.current[selectedIncidentId]) {
            const selectedMarker = markers.current[selectedIncidentId];
            const element = selectedMarker.getElement();
            element.classList.add('selected');
            
            // Center map on selected incident
            const incident = incidents.find(i => i.id === selectedIncidentId);
            if (incident) {
                map.current.flyTo({
                    center: [incident.longitude, incident.latitude],
                    zoom: 14,
                    duration: 1000
                });
            }
        }
    }, [selectedIncidentId, incidents, mapLoaded]);

    // Create custom marker element
    const createMarkerElement = (incident) => {
        const markerDiv = document.createElement('div');
        markerDiv.className = 'custom-marker';
        
        const statusColor = getStatusColor(incident.status);
        
        markerDiv.innerHTML = `
            <div class="marker-pin" style="background-color: ${statusColor}">
                <div class="marker-pulse"></div>
            </div>
            <div class="marker-tooltip">
                <strong>${incident.user}</strong><br>
                ${incident.status}<br>
                ${new Date(incident.created_at).toLocaleTimeString()}
            </div>
        `;

        return markerDiv;
    };

    // Get status color for marker
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#ff4757';
            case 'acknowledged':
                return '#ffa502';
            case 'closed':
                return '#2ed573';
            default:
                return '#747d8c';
        }
    };

    return (
        <div className="map-view">
            <div className="map-header">
                <h3>Live Map</h3>
                <div className="map-stats">
                    <span className="stat-item">
                        <span className="stat-label">Total:</span>
                        <span className="stat-value">{incidents.length}</span>
                    </span>
                    <span className="stat-item">
                        <span className="stat-label">Active:</span>
                        <span className="stat-value">
                            {incidents.filter(i => i.status === 'active').length}
                        </span>
                    </span>
                </div>
            </div>
            
            <div className="map-container">
                <div ref={mapContainer} className="map" />
                
                {!mapLoaded && (
                    <div className="map-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading map...</p>
                    </div>
                )}
                
                {!process.env.REACT_APP_MAPBOX_TOKEN && (
                    <div className="map-error">
                        <p>Mapbox token not configured</p>
                        <p>Please set REACT_APP_MAPBOX_TOKEN environment variable</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapView;
