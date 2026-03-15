// script.js - Remove the API_KEY constant
const API_URL = '/api/weather'; // This calls your serverless function

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

// Event listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading();
    
    try {
        // Call your own API endpoint instead of OpenWeather directly
        const response = await fetch(`${API_URL}?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data');
        }
        
        displayWeather(data);
    } catch (err) {
        showError(err.message);
    }
}

function displayWeather(data) {
    loading.style.display = 'none';
    error.style.display = 'none';
    
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    description.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    
    weatherDetails.style.display = 'block';
}

function showLoading() {
    loading.style.display = 'block';
    error.style.display = 'none';
    weatherDetails.style.display = 'none';
}

function showError(message) {
    loading.style.display = 'none';
    error.style.display = 'block';
    weatherDetails.style.display = 'none';
    error.textContent = message;
}