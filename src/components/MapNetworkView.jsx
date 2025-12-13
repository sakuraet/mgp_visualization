import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import UNIVERSITY_COORDS from '../university_coordinates.js';

const MapNetworkView = ({ graphData, focusNode, onNodeClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([20, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers and lines when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !graphData || !graphData.nodes) return;

    // Clear existing markers and lines
    markersRef.current.forEach(marker => marker.remove());
    linesRef.current.forEach(line => line.remove());
    markersRef.current = [];
    linesRef.current = [];

    // Create a map of node ID to coordinates
    const nodeCoords = new Map();
    const nodesAtLocation = new Map();

    // First pass: determine coordinates for each node
    graphData.nodes.forEach(node => {
      // Handle different possible formats for university field
      let university = 'Unknown';
      
      // Your data format: node.university might be the school field
      // Or it might be in a schools array
      if (node.university) {
        university = node.university;
      } else if (node.school) {
        university = node.school;
      } else if (node.schools && Array.isArray(node.schools) && node.schools.length > 0) {
        // Handle schools array: ["University Name, Country"]
        university = node.schools[0];
      }
      
      let coords = UNIVERSITY_COORDS[university];

      if (!coords) {
        console.warn(`No coordinates found for: "${university}"`);
        return; // Skip nodes without coordinates
      }

      // Handle multiple nodes at same location by adding small offset
      const locationKey = coords.join(',');
      const nodesAtLoc = nodesAtLocation.get(locationKey) || 0;
      
      // Add small offset to prevent exact overlap
      const offset = nodesAtLoc * 0.0005;
      const angle = nodesAtLoc * (Math.PI * 2 / 8);
      const adjustedCoords = [
        coords[0] + offset * Math.cos(angle),
        coords[1] + offset * Math.sin(angle)
      ];

      nodesAtLocation.set(locationKey, nodesAtLoc + 1);
      nodeCoords.set(node.id, adjustedCoords);
    });

    // Draw connection lines first so they appear under markers
    if (graphData.links) {
      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        const sourceCoords = nodeCoords.get(sourceId);
        const targetCoords = nodeCoords.get(targetId);

        if (sourceCoords && targetCoords) {
          const line = L.polyline([sourceCoords, targetCoords], {
            color: '#666',
            weight: 1,
            opacity: 0.4,
          }).addTo(mapInstanceRef.current);
          
          linesRef.current.push(line);
        }
      });
    }

    // Create markers for each node
    graphData.nodes.forEach(node => {
      const coords = nodeCoords.get(node.id);
      if (!coords) return;

      // Determine marker color based on node type
      let color = '#9dc183'; // student (default)

      if (node.isFocus) {
        color = '#5e734e'; // focus color
      } else if (node.isCohortPeer) {
        color = '#5e734e'; // cohort peer color
      } else if (node.isAncestor) {
        color = '#2d5016'; // advisor color
      }

      // Get university name for display
      let displayUniversity = 'Unknown';
      if (node.university) {
        displayUniversity = node.university;
      } else if (node.school) {
        displayUniversity = node.school;
      } else if (node.schools && Array.isArray(node.schools) && node.schools.length > 0) {
        displayUniversity = node.schools[0];
      }

      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      // Around line 130-160, replace the marker creation:
      const marker = L.marker(coords, { icon })
        .bindPopup(`
          <div style="min-width: 250px; font-family: Arial, sans-serif;">
            <strong style="font-size: 16px; color: #333;">${node.name}</strong>
            ${node.year && node.year !== 'N/A' ? ` <span style="color: #666;">(${node.year})</span>` : ''}
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;"/>
      
            ${node.advisors && node.advisors.length > 0 ? `
              <div style="margin-bottom: 8px;">
                <strong>Advisors:</strong> ${node.advisors.join(', ')}
              </div>
            ` : ''}
      
            <div style="margin-bottom: 4px;">
              <strong>Shown Descendants:</strong> ${node.shownDescendants || 0}
            </div>
      
            <div style="margin-bottom: 8px;">
              <strong>Total Descendants:</strong> ${node.totalDescendants || 'N/A'}
            </div>
      
            <div style="margin-bottom: 8px;">
              <strong>School:</strong> ${displayUniversity}
            </div>
      
            ${node.thesis && node.thesis !== 'N/A' ? `
              <div style="margin-bottom: 8px;">
                <strong>Thesis:</strong> <em>${node.thesis}</em>
              </div>
            ` : ''}
      
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;"/>
            <div style="color: #666; font-size: 12px;">
              <strong>Type:</strong> ${
                node.isFocus ? 'Focus' : 
                node.isAncestor ? 'Advisor' : 
                node.isCohortPeer ? 'Cohort Peer' : 
                'Student'
              }
            </div>
        `, {
          maxWidth: 350
        })
        .addTo(mapInstanceRef.current);

      // Add double-click event to refocus graph
      marker.on('dblclick', () => {
        if (node.mrauth_id && onNodeClick) {
          console.log(`Map: Double-clicked ${node.name}, refocusing to ID ${node.mrauth_id}`);
          onNodeClick(node.mrauth_id);
        }
        markersRef.current.push(marker);
      });
    });

    // Zoom to the focus node first
    if (focusNode && nodeCoords.has(focusNode)) {
      const focusCoords = nodeCoords.get(focusNode);
      mapInstanceRef.current.setView(focusCoords, 12, { animate: true });
      return; // prevent automatic zooming to all markers
    }

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = L.latLngBounds(
        markersRef.current.map(m => m.getLatLng())
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [graphData, focusNode, onNodeClick]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapNetworkView;
