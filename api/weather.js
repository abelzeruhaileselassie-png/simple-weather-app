// api/weather.js - Serverless function with map tile support
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { city, tile, layer, z, x, y } = req.query;
    
    // Handle map tile requests
    if (tile === 'true') {
        return handleMapTile(req, res, layer, z, x, y);
    }
    
    // Handle weather data requests
    return handleWeatherData(req, res, city);
}

// Handle weather data requests
async function handleWeatherData(req, res, city) {
    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }
    
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        console.error('API key not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('OpenWeatherMap error:', data);
            return res.status(response.status).json({ 
                error: data.message || 'Weather service error' 
            });
        }
        
        res.status(200).json(data);
    } catch (error) {
        console.error('Serverless function error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
}

// Handle map tile requests
async function handleMapTile(req, res, layer, z, x, y) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }
    
    if (!layer || !z || !x || !y) {
        return res.status(400).json({ error: 'Missing tile parameters' });
    }
    
    // Default to precipitation layer if none specified
    const layerCode = layer || 'precipitation_new';
    
    try {
        const tileUrl = `https://tile.openweathermap.org/map/${layerCode}/${z}/${x}/${y}.png?appid=${apiKey}`;
        
        const response = await fetch(tileUrl);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch map tile' });
        }
        
        const imageBuffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        console.error('Map tile error:', error);
        res.status(500).json({ error: 'Failed to fetch map tile' });
    }
}