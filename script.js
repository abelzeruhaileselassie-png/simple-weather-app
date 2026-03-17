// script.js - Full-screen weather map with Addis Ababa as default
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
let cityMarker;
let weatherLayer;
// Addis Ababa coordinates
let cityCoordinates = { lat: 9.024, lon: 38.7469 }; // Default to Addis Ababa

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
    // Load Addis Ababa as default city
    cityInput.value = 'Addis Ababa';
    searchWeather();
});

// Initialize map function
function initMap() {
    // Create map centered on default location with full-screen settings
    map = L.map('weather-map', {
        fullscreenControl: true,
        zoomControl: true,
        attributionControl: false // We have our own attribution
    }).setView([cityCoordinates.lat, cityCoordinates.lon], 8);
    
    // Add a beautiful base map layer - CartoDB Voyager (clean and modern)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);
    
    // Add precipitation layer by default (shows rain/snow)
    addWeatherLayer('precipitation_new');
    
    // Make map responsive to window resize
    window.addEventListener('resize', () => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    });
}

// Add weather layer to map
function addWeatherLayer(layerType) {
    // Remove existing weather layer if any
    if (weatherLayer) {
        map.removeLayer(weatherLayer);
    }
    
    // Create tile layer URL with your API key proxied through serverless function
    weatherLayer = L.tileLayer(`/api/weather?tile=true&layer=${layerType}&z={z}&x={x}&y={y}`, {
        opacity: 0.6,
        minZoom: 3,
        maxZoom: 10,
        attribution: ''
    }).addTo(map);
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
function updateMapLocation(lat, lon, cityNameText) {
    cityCoordinates = { lat, lon };
    
    // Center map on new location with smooth animation
    if (map) {
        map.flyTo([lat, lon], 10, {
            duration: 2 // Animation duration in seconds
        });
        
        // Remove existing marker
        if (cityMarker) {
            map.removeLayer(cityMarker);
        }
        
        // Add a marker for the city
        cityMarker = L.marker([lat, lon]).addTo(map);
        
        // Add popup with city name and temperature
        cityMarker.bindPopup(`
            <b>${cityNameText}</b><br>
            <span style="font-size: 18px; color: #667eea;">${temperature.textContent}</span><br>
            <span style="text-transform: capitalize;">${description.textContent}</span>
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