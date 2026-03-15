// script.js - Complete file with weather maps
const API_URL = '/api/weather'; // Calls your serverless function

// DOM elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const weatherDetails = document.getElementById('weather-details');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');

// Map variables
let map;
let currentLayer;
let cityMarker;
let cityCoordinates = { lat: 51.5074, lon: -0.1278 }; // Default to London

// Layer configurations for OpenWeatherMap
const layerConfigs = {
    'temp': {
        layer: 'temp_new',
        name: 'Temperature',
        legend: ['-20°C', '0°C', '20°C', '40°C']
    },
    'rain': {
        layer: 'precipitation_new',
        name: 'Rain',
        legend: ['Light', 'Moderate', 'Heavy']
    },
    'clouds': {
        layer: 'clouds_new',
        name: 'Clouds',
        legend: ['Clear', 'Scattered', 'Broken', 'Overcast']
    },
    'wind': {
        layer: 'wind_new',
        name: 'Wind',
        legend: ['Light', 'Moderate', 'Strong']
    },
    'pressure': {
        layer: 'pressure_new',
        name: 'Pressure',
        legend: ['Low', 'Normal', 'High']
    },
    'snow': {
        layer: 'snow_new',
        name: 'Snow',
        legend: ['Light', 'Moderate', 'Heavy']
    }
};

// Event listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Initialize map when page loads
window.addEventListener('load', () => {
    initMap();
});

// Initialize map function
function initMap() {
    // Create map centered on default location
    map = L.map('weather-map').setView([cityCoordinates.lat, cityCoordinates.lon], 8);
    
    // Add OpenStreetMap base layer (better looking than default)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Add default weather layer (temperature)
    changeMapLayer('temp');
    
    // Add layer control buttons
    document.querySelectorAll('.map-layer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.map-layer-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            changeMapLayer(e.target.dataset.layer);
            updateLegend(e.target.dataset.layer);
        });
    });
}

// Change map layer function
function changeMapLayer(layerType) {
    // Remove existing weather layer if any
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    const config = layerConfigs[layerType] || layerConfigs['temp'];
    
    // Create new weather layer using OpenWeatherMap plugin
    currentLayer = L.OWM.current(config.layer, {
        appId: 'DEMO_KEY', // Note: This will be proxied through your serverless function
        opacity: 0.7,
        minZoom: 3,
        maxZoom: 10,
        showLegend: false,
        legendImagePath: null
    });
    
    map.addLayer(currentLayer);
}

// Update legend based on layer type
function updateLegend(layerType) {
    const legend = document.getElementById('map-legend');
    const config = layerConfigs[layerType] || layerConfigs['temp'];
    
    // Clear existing legend
    legend.innerHTML = '';
    
    // Add new legend items
    config.legend.forEach((text, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const color = getColorForIndex(index, layerType);
        
        item.innerHTML = `<span style="background: ${color}"></span> ${text}`;
        legend.appendChild(item);
    });
}

// Get color for legend based on layer type and index
function getColorForIndex(index, layerType) {
    const colors = {
        'temp': ['#0000ff', '#00ffff', '#ffff00', '#ff0000'],
        'rain': ['#ffff99', '#66ccff', '#3366ff'],
        'clouds': ['#f9f9f9', '#cccccc', '#999999', '#666666'],
        'wind': ['#90EE90', '#FFD700', '#FF6347'],
        'pressure': ['#FFE4E1', '#FFB6C1', '#FF69B4'],
        'snow': ['#E0FFFF', '#B0E0E6', '#87CEEB']
    };
    
    return (colors[layerType] || colors['temp'])[index] || '#cccccc';
}

// Search weather function
async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading();
    
    try {
        const response = await fetch(`${API_URL}?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data');
        }
        
        displayWeather(data);
        
        // Update map with new city coordinates
        if (data.coord) {
            updateMapLocation(data.coord.lat, data.coord.lon, data.name);
        }
        
    } catch (err) {
        console.error('Error:', err);
        showError(err.message);
    }
}

// Display weather data
function displayWeather(data) {
    // Hide loading and error
    loading.style.display = 'none';
    error.style.display = 'none';
    
    // Check if we have valid data
    if (!data.name || !data.sys || !data.main || !data.weather) {
        showError('Invalid weather data received');
        return;
    }
    
    // Update weather details
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    description.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    
    // Show weather details
    weatherDetails.style.display = 'block';
}

// Update map location
function updateMapLocation(lat, lon, cityName) {
    cityCoordinates = { lat, lon };
    
    // Center map on new location
    if (map) {
        map.setView([lat, lon], 10);
        
        // Remove existing marker
        if (cityMarker) {
            map.removeLayer(cityMarker);
        }
        
        // Add a marker for the city with custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: '📍',
            iconSize: [30, 30],
            popupAnchor: [0, -15]
        });
        
        cityMarker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        
        // Add popup with city name and temperature
        cityMarker.bindPopup(`
            <b>${cityName}</b><br>
            ${temperature.textContent}<br>
            ${description.textContent}
        `).openPopup();
    }
}

// Show loading state
function showLoading() {
    loading.style.display = 'block';
    error.style.display = 'none';
    weatherDetails.style.display = 'none';
}

// Show error message
function showError(message) {
    loading.style.display = 'none';
    error.style.display = 'block';
    weatherDetails.style.display = 'none';
    error.textContent = message;
}

// Optional: Load default city on startup
window.addEventListener('load', () => {
    console.log('Weather app with maps loaded');
    // Uncomment to load a default city
    // cityInput.value = 'London';
    // searchWeather();
});