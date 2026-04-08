import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Text } from '../core';
import { geocodeItems } from '../../services/geocodingService';

// Fix for default marker icons in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Component to handle map centering when items change
 */
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    const validCoords = (coords || []).filter(c => c && !isNaN(c.lat) && !isNaN(c.lng));
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

const CellMap = ({ cells = [], loading: parentLoading }) => {
  const [geocodedCells, setGeocodedCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCells = async () => {
      if (!cells || cells.length === 0) {
        setGeocodedCells([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const results = await geocodeItems(cells, 'cep');
        setGeocodedCells(results);
      } catch (err) {
        console.error("[CellMap] Error processing cells:", err);
        setError("Não foi possível carregar as localizações no mapa.");
      } finally {
        setLoading(false);
      }
    };

    processCells();
  }, [cells]);

  if (parentLoading || loading) {
    return (
      <Box height="400px" bg="surface" display="flex" alignItems="center" justifyContent="center" borderRadius="lg" border>
        <Text color="textMuted">Carregando mapa e localizando células...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box height="400px" bg="surface" display="flex" alignItems="center" justifyContent="center" borderRadius="lg" border>
        <VStack gap="sm" alignItems="center">
          <Text color="danger" weight="600">{error}</Text>
          <Text size="xs" color="textMuted">Verifique se os CEPs estão corretos.</Text>
        </VStack>
      </Box>
    );
  }

  if (geocodedCells.length === 0) {
    return (
      <Box height="400px" bg="surface" display="flex" alignItems="center" justifyContent="center" borderRadius="lg" border>
        <Text color="textMuted">Nenhuma célula com CEP válido encontrada para exibir no mapa.</Text>
      </Box>
    );
  }

  // Validate center
  const firstValid = geocodedCells.find(c => c.coords && !isNaN(c.coords.lat) && !isNaN(c.coords.lng));
  const defaultCenter = firstValid ? [firstValid.coords.lat, firstValid.coords.lng] : [-15.78, -47.93];

  return (
    <Box height="400px" borderRadius="lg" border style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geocodedCells.map((cell) => (
          <Marker 
            key={cell.id || cell.uid} 
            position={[cell.coords.lat, cell.coords.lng]}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <Text weight="700" size="sm" style={{ display: 'block', marginBottom: '4px' }}>{cell.name}</Text>
                <Text size="xs" color="textMuted" style={{ display: 'block' }}>Líder: {cell.leaderName || 'Não definido'}</Text>
                <Text size="xs" color="textMuted" style={{ display: 'block' }}>Membros: {cell.memberCount || 0}</Text>
                <Text size="xs" color="primary" weight="600" style={{ display: 'block', marginTop: '4px' }}>CEP: {cell.cep}</Text>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapRecenter coords={geocodedCells.map(c => c.coords)} />
      </MapContainer>
    </Box>
  );
};

export default CellMap;
