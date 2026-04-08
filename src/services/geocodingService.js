const CACHE_KEY = 'nexo_hub_cep_cache';

/**
 * Gets coordinates for a given CEP using BrasilAPI v2.
 * Implements a localStorage cache to avoid redundant API calls.
 */
export const getCoordinatesByCEP = async (cep) => {
  if (!cep) return null;
  
  // Normalize CEP (remove non-digits)
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return null;

  // Check Cache
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  if (cache[cleanCEP]) {
    console.log(`[Geocoding] Cache hit for CEP ${cleanCEP}`);
    return cache[cleanCEP];
  }

  try {
    console.log(`[Geocoding] Fetching coordinates for CEP ${cleanCEP}...`);
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);
    
    if (!response.ok) {
      console.warn(`[Geocoding] CEP ${cleanCEP} not found (Status: ${response.status})`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.location && data.location.coordinates) {
      const lat = parseFloat(data.location.coordinates.latitude);
      const lng = parseFloat(data.location.coordinates.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error(`[Geocoding] Invalid coordinates received for CEP ${cleanCEP}`);
        return null;
      }

      const coords = { lat, lng };
      
      // Save to Cache
      cache[cleanCEP] = coords;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      
      return coords;
    }
    
    return null;
  } catch (error) {
    console.error(`[Geocoding] Exception fetching CEP ${cleanCEP}:`, error);
    return null;
  }
};

/**
 * Batch geocoding for a list of items with CEPs.
 */
export const geocodeItems = async (items, cepField = 'cep') => {
  const results = await Promise.all(
    items.map(async (item) => {
      const coords = await getCoordinatesByCEP(item[cepField]);
      return { ...item, coords };
    })
  );
  return results.filter(item => item.coords !== null);
};
