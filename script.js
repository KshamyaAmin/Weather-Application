const apiKey = '4f127f7ef98a0e2be316ccd0eaf504c8';

// DOM elements
const getWeatherBtn = document.getElementById('getWeatherBtn');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
const hourlyTitle = document.getElementById('hourlyTitle');
const dailyTitle = document.getElementById('dailyTitle');
const particlesContainer = document.getElementById('particles');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const searchHistoryList = document.getElementById('searchHistoryList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const backBtn = document.getElementById('backBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmClearBtn = document.getElementById('confirmClearBtn');
const cancelClearBtn = document.getElementById('cancelClearBtn');
const mainPageWrapper = document.getElementById('mainPageWrapper');
const resultsPageWrapper = document.getElementById('resultsPageWrapper');

// Theme toggle elements
const themeToggleCheckbox = document.getElementById('themeToggleCheckbox');
const themeLabel = document.getElementById('themeLabel');

// Search history storage
let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];

// Backgrounds for themes
const lightThemeDefaultBg = "linear-gradient(to top, #83a4d4, #b6fbff)";
const darkThemeDefaultBg = "linear-gradient(to top, #0f2027, #203a43, #2c5364)";

// === THEME TOGGLE LOGIC ===
const savedTheme = localStorage.getItem('weatherAppTheme');
if (savedTheme === 'dark') {
  setTheme('dark');
  themeToggleCheckbox.checked = true;
} else {
  setTheme('default');
  themeToggleCheckbox.checked = false;
}

themeToggleCheckbox.addEventListener('change', () => {
  if (themeToggleCheckbox.checked) {
    setTheme('dark');
  } else {
    setTheme('default');
  }
});

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeLabel.textContent = 'Dark Theme';
    localStorage.setItem('weatherAppTheme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeLabel.textContent = 'Light Theme';
    localStorage.setItem('weatherAppTheme', 'default');
  }
  // Apply background on main page change
  if (mainPageWrapper.style.display !== 'none') {
    applyThemeBackground();
  }
}

function applyThemeBackground() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    document.body.style.background = darkThemeDefaultBg;
  } else {
    document.body.style.background = lightThemeDefaultBg;
  }
}

// Render search history UI
function renderSearchHistory() {
  searchHistoryList.innerHTML = '';
  searchHistory.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.addEventListener('click', () => {
      cityInput.value = city;
      showResultsPage(city);
    });
    searchHistoryList.appendChild(li);
  });
  clearHistoryBtn.style.display = searchHistory.length > 0 && searchHistoryList.style.display === "flex" ? 'inline-block' : 'none';
}

// Toggle search history list visibility
toggleHistoryBtn.addEventListener('click', () => {
  const isHidden = searchHistoryList.style.display === 'none';
  searchHistoryList.style.display = isHidden ? 'flex' : 'none';
  toggleHistoryBtn.textContent = isHidden ? '📕 Hide Search History' : '📜 Show Search History';
  clearHistoryBtn.style.display = (isHidden && searchHistory.length > 0) ? 'inline-block' : 'none';
  if (isHidden) {
    searchHistoryList.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// Clear history with confirmation modal
clearHistoryBtn.addEventListener('click', () => {
  confirmModal.style.display = 'flex';
});
confirmClearBtn.addEventListener('click', () => {
  localStorage.removeItem('weatherSearchHistory');
  searchHistory = [];
  renderSearchHistory();
  clearHistoryBtn.style.display = 'none';
  confirmModal.style.display = 'none';
});
cancelClearBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
});

// Show Results page & fetch weather
async function showResultsPage(city) {
  if (!city) return;

  if (!searchHistory.includes(city)) {
    searchHistory.push(city);
    localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
    renderSearchHistory();
  }

  mainPageWrapper.style.display = 'none';
  resultsPageWrapper.style.display = 'flex';

  weatherResult.innerHTML = '<p>Loading...</p>';
  weatherResult.classList.add('show');

  try {
    const currentData = await fetchCurrentWeather(city);
    displayCurrentWeather(currentData);
    updateBackground(currentData.weather[0].main);
    createParticles(currentData.weather[0].main);

    const forecastData = await fetchForecast(city);
    displayHourlyForecast(forecastData);
    displayDailyForecast(forecastData);
  } catch (error) {
    weatherResult.innerHTML = `<p>${error.message}</p>`;
    hourlyForecast.innerHTML = '';
    dailyForecast.innerHTML = '';
  }
}

// Back button click handler
backBtn.addEventListener('click', () => {
  // Clear UI
  weatherResult.innerHTML = '';
  hourlyForecast.innerHTML = '';
  dailyForecast.innerHTML = '';
  particlesContainer.innerHTML = '';
  hourlyForecast.style.display = 'none';
  dailyForecast.style.display = 'none';
  hourlyTitle.style.display = 'none';
  dailyTitle.style.display = 'none';
  cityInput.value = '';
  weatherResult.classList.remove('show');
  resultsPageWrapper.style.display = 'none';
  mainPageWrapper.style.display = 'flex';

  applyThemeBackground(); // Reset background to theme default for main page
});

getWeatherBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city === '') {
    weatherResult.innerHTML = '<p>Please enter a city name.</p>';
    weatherResult.classList.add('show');
    return;
  }
  showResultsPage(city);
});

searchHistoryList.addEventListener('click', e => {
  if (e.target.tagName === 'LI') {
    cityInput.value = e.target.textContent;
    showResultsPage(e.target.textContent);
  }
});

// Fetch current weather
async function fetchCurrentWeather(city) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
  if (!response.ok) throw new Error('City not found.');
  const data = await response.json();
  return data;
}

// Fetch 5-day/3-hour forecast
async function fetchForecast(city) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
  if (!response.ok) throw new Error('Forecast not found.');
  const data = await response.json();
  return data;
}

// Display current weather
function displayCurrentWeather(data) {
  const { name, sys, main, weather, wind } = data;
  const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
  const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(sys.sunset * 1000).toLocaleTimeString();

  weatherResult.innerHTML = `
    <h2>${name}, ${sys.country}</h2>
    <img src="${iconUrl}" alt="${weather[0].description}" />
    <p><strong>${weather[0].main}</strong> - ${weather[0].description}</p>
    <p>🌡 ${main.temp}°C (Feels like: ${main.feels_like}°C)</p>
    <p>💧 ${main.humidity}% humidity</p>
    <p>💨 ${wind.speed} m/s wind</p>
    <p>🌅 Sunrise: ${sunrise}</p>
    <p>🌇 Sunset: ${sunset}</p>
  `;
}

// Display hourly forecast (next 6 3-hour intervals)
function displayHourlyForecast(data) {
  hourlyForecast.innerHTML = '';
  hourlyForecast.style.display = 'flex';
  hourlyTitle.style.display = 'block';

  for (let i = 0; i < 6 && i < data.list.length; i++) {
    const forecast = data.list[i];
    const dt = new Date(forecast.dt * 1000);
    const time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const temp = Math.round(forecast.main.temp);
    const icon = forecast.weather[0].icon;
    const description = forecast.weather[0].main;

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <p>${time}</p>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
      <p>${temp}°C</p>
    `;
    hourlyForecast.appendChild(card);
  }
}

// Display daily forecast (one item per day, max 5 days)
function displayDailyForecast(data) {
  dailyForecast.innerHTML = '';
  dailyForecast.style.display = 'flex';
  dailyTitle.style.display = 'block';

  const dailyAdded = {};
  for (const forecast of data.list) {
    const dt = new Date(forecast.dt * 1000);
    const dateKey = dt.toDateString();
    if (!dailyAdded[dateKey]) {
      dailyAdded[dateKey] = true;

      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const temp = Math.round(forecast.main.temp);
      const icon = forecast.weather[0].icon;
      const description = forecast.weather[0].main;

      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.innerHTML = `
        <p>${dayName} <br> <small>${fullDate}</small></p>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
        <p>${temp}°C</p>
      `;
      dailyForecast.appendChild(card);

      if (Object.keys(dailyAdded).length === 5) break;
    }
  }
}

// Update background based on weather main condition (results page only)
function updateBackground(weatherMain) {
  let backgroundStyle;
  switch (weatherMain.toLowerCase()) {
    case 'clear':
      backgroundStyle = "linear-gradient(to top, #fceabb, #f8b500)";
      break;
    case 'clouds':
      backgroundStyle = "linear-gradient(to top, #bdc3c7, #2c3e50)";
      break;
    case 'rain':
    case 'drizzle':
      backgroundStyle = "linear-gradient(to top, #4b79a1, #283e51)";
      break;
    case 'thunderstorm':
      backgroundStyle = "linear-gradient(to top, #1f1c2c, #928dab)";
      break;
    case 'snow':
      backgroundStyle = "linear-gradient(to top, #e6dada, #274046)";
      break;
    case 'mist':
    case 'fog':
    case 'haze':
      backgroundStyle = "linear-gradient(to top, #3e5151, #decba4)";
      break;
    default:
      backgroundStyle = lightThemeDefaultBg;
  }
  document.body.style.background = backgroundStyle;
  return backgroundStyle;
}

// Weather particle animations
function createParticles(weatherMain) {
  particlesContainer.innerHTML = '';
  const count = 50;
  switch (weatherMain.toLowerCase()) {
    case 'clear':
      const sunray = document.createElement('div');
      sunray.className = 'sunray';
      particlesContainer.appendChild(sunray);
      break;
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'particle rain';
        drop.style.left = `${Math.random() * 100}vw`;
        drop.style.animationDuration = `${0.5 + Math.random()}s`;
        particlesContainer.appendChild(drop);
      }
      break;
    case 'snow':
      for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.className = 'particle snow';
        flake.style.left = `${Math.random() * 100}vw`;
        flake.style.animationDuration = `${2 + Math.random() * 3}s`;
        particlesContainer.appendChild(flake);
      }
      break;
    case 'clouds':
    case 'mist':
    case 'fog':
    case 'haze':
      for (let i = 0; i < 10; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'particle cloud';
        cloud.style.top = `${Math.random() * 50}vh`;
        cloud.style.animationDuration = `${30 + Math.random() * 30}s`;
        particlesContainer.appendChild(cloud);
      }
      break;
    default:
      // No particles for other conditions
      break;
  }
}

// Initial render
renderSearchHistory();
applyThemeBackground();
