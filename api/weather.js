// api/weather.js - This runs on Vercel's servers
export default async function handler(req, res) {
    // Enable CORS so your frontend can call this
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Get the city from the query parameter
    const { city } = req.query;
    
    if (!city) {
        return res.status(400).json({ error: 'City is required' });
    }
    
    // Get API key from environment variable (set in Vercel dashboard)
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }
    
    try {
        // Make the request to OpenWeatherMap
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
        );
        
        const data = await response.json();
        
        // Return the data to your frontend
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
}