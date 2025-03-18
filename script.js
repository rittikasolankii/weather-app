// API key for OpenWeatherMap - you'll need to get your own
const API_KEY = 'e2b1415e643f0f9892d46bf6dff48673';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loader = document.getElementById('loader');
const weatherInfo = document.getElementById('weather-info');
const errorContainer = document.getElementById('error-container');
const forecastContainer = document.getElementById('forecast-container');

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

cityInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoader();
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherDataByCoords(latitude, longitude);
            },
            error => {
                hideLoader();
                showError("Unable to retrieve your location. Please allow location access or search by city name.");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

// Function to get weather data by city name
async function getWeatherData(city) {
    showLoader();
    try {
        // Get current weather
        const weatherResponse = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const weatherData = await weatherResponse.json();
        
        // Get 5-day forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(weatherData);
        displayForecastData(forecastData);
    } catch (error) {
        showError(error.message === 'City not found' ? 'City not found. Please try again.' : 'Something went wrong. Please try again later.');
    } finally {
        hideLoader();
    }
}

// Function to get weather data by coordinates
async function getWeatherDataByCoords(lat, lon) {
    try {
        // Get current weather
        const weatherResponse = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();
        
        // Get 5-day forecast
        const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(weatherData);
        displayForecastData(forecastData);
    } catch (error) {
        showError('Something went wrong. Please try again later.');
    } finally {
        hideLoader();
    }
}

// Function to display current weather data
function displayWeatherData(data) {
    // Hide error container if visible
    errorContainer.style.display = 'none';
    
    // Format and display the data
    const { name, main, weather, wind, sys } = data;
    const date = new Date();
    
    weatherInfo.innerHTML = `
        <h2 class="city-name">${name}, ${sys.country}</h2>
        <p class="date">${formatDate(date)}</p>
        
        <div class="weather-main">
            <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}" class="weather-icon">
            <span class="temperature">${Math.round(main.temp)}°C</span>
        </div>
        
        <p class="description">${weather[0].description}</p>
        
        <div class="details">
            <div class="detail-item">
                <p class="detail-label">Feels Like</p>
                <p class="detail-value">${Math.round(main.feels_like)}°C</p>
            </div>
            <div class="detail-item">
                <p class="detail-label">Humidity</p>
                <p class="detail-value">${main.humidity}%</p>
            </div>
            <div class="detail-item">
                <p class="detail-label">Wind</p>
                <p class="detail-value">${(wind.speed * 3.6).toFixed(1)} km/h</p>
            </div>
            <div class="detail-item">
                <p class="detail-label">Pressure</p>
                <p class="detail-value">${main.pressure} hPa</p>
            </div>
            <div class="detail-item">
                <p class="detail-label">Max Temp</p>
                <p class="detail-value">${Math.round(main.temp_max)}°C</p>
            </div>
            <div class="detail-item">
                <p class="detail-label">Min Temp</p>
                <p class="detail-value">${Math.round(main.temp_min)}°C</p>
            </div>
        </div>
    `;
    
    weatherInfo.style.display = 'block';
}

// Function to display forecast data
function displayForecastData(data) {
    // Process forecast data (every 8 items represents a day - 3 hour intervals)
    const dailyForecasts = [];
    const forecasts = data.list;
    
    // Find unique days
    for (let i = 0; i < forecasts.length; i += 8) {
        if (dailyForecasts.length >= 5) break; // Limit to 5 days
        
        const forecast = forecasts[i];
        const date = new Date(forecast.dt * 1000);
        
        dailyForecasts.push({
            day: formatDay(date),
            icon: forecast.weather[0].icon,
            temp: Math.round(forecast.main.temp)
        });
    }
    
    // Generate HTML for forecast
    let forecastHTML = `
        <h3 class="forecast-title">5-Day Forecast</h3>
        <div class="forecast-items">
    `;
    
    dailyForecasts.forEach(item => {
        forecastHTML += `
            <div class="forecast-item">
                <p class="forecast-day">${item.day}</p>
                <img src="https://openweathermap.org/img/wn/${item.icon}.png" alt="weather icon" class="forecast-icon">
                <p class="forecast-temp">${item.temp}°C</p>
            </div>
        `;
    });
    
    forecastHTML += `</div>`;
    
    forecastContainer.innerHTML = forecastHTML;
    forecastContainer.style.display = 'block';
}

// Helper function to format date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format day
function formatDay(date) {
    const options = { weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Function to show loader
function showLoader() {
    weatherInfo.style.display = 'none';
    errorContainer.style.display = 'none';
    forecastContainer.style.display = 'none';
    loader.style.display = 'flex';
}

// Function to hide loader
function hideLoader() {
    loader.style.display = 'none';
}

// Function to show error
function showError(message) {
    weatherInfo.style.display = 'none';
    forecastContainer.style.display = 'none';
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
}

// Initialize the app with a default city
window.addEventListener('load', () => {
    getWeatherData('London');
});