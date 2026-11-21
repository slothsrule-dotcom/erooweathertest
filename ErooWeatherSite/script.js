const latitude = 43.12;
const longitude = -77.68;

const stationId = 'KROC';
const headers = {
    'User-Agent': '(myweatherapp.com, contact@myweatherapp.com)',
    'Accept': 'application/geo+json'
};

function getWeatherIconPath(description) {
    if (!description) return 'icons/sunny.png';
    const desc = description.toLowerCase();

    if (desc.includes('Light Rain and Light Snow') || desc.includes('Rain and Snow')) {
        return 'icons/mixed-precip.png';
    }
    
    // 1. SNOW CONDITIONS
    if (desc.includes('snow') || desc.includes('blizzard') || desc.includes('flurries')) {
        if (desc.includes('heavy') || desc.includes('blizzard')) return 'icons/big-snow.png';
        if (desc.includes('mostly sunny')) return 'icons/mostly-sunny-snow.png';
        if (desc.includes('partly sunny') || desc.includes('partly cloudy')) return 'icons/partly-sunny-snow.png';
        if (desc.includes('dark') || desc.includes('overcast')) return 'icons/dark-snowy.png';
        return 'icons/snowy.png';
    }

    // 2. THUNDERSTORMS
    if (desc.includes('thunder') || desc.includes('tstorm')) {
        if (desc.includes('rain')) return 'icons/rainy-tstorm.png';
        return 'icons/tstorm.png';
    }

    // 3. SLEET / MIXED PRECIPITATION
    if (desc.includes('sleet') || desc.includes('freezing rain') || desc.includes('mixed')) {
        if (desc.includes('dark') || desc.includes('overcast')) return 'icons/dark-mixed-precip.png';
        if (desc.includes('partly') || desc.includes('mostly sunny')) return 'icons/partly-sunny-mixed-precip.png';
        return 'icons/mixed-precip.png';
    }

    // 4. RAIN / SHOWERS (Distinguishing between cloudy vs sunny rain)
    if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
        if (desc.includes('heavy')) return 'icons/dark-rainy.png';

        // Only use sun-and-rain icons if the forecast specifically mentions sun
        if (desc.includes('mostly sunny')) return 'icons/mostly-sunny-rain.png';
        if (desc.includes('partly sunny')) return 'icons/partly-sunny-rain.png';

        // Otherwise, if it's cloudy, overcast, or just a generic "chance of rain", use a solid cloud rain icon
        if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('chance') || desc.includes('slight chance')) {
            return 'icons/rainy.png';
        }
        
        return 'icons/rainy.png';
    }

    // 5. SKY & CLOUD CONDITIONS (No precipitation)
    if (desc.includes('haze') || desc.includes('smoke')) return 'icons/hazy-sunshine.png';
    if (desc.includes('mostly sunny') || desc.includes('mostly clear')) return 'icons/mostly-sunny.png';
    if (desc.includes('partly sunny') || desc.includes('partly cloudy')) return 'icons/partly-sunny.png';
    if (desc.includes('mostly cloudy')) return 'icons/mostly-cloudy.png';
    if (desc.includes('overcast') || desc.includes('cloud')) return 'icons/cloud.png'; // Uses your cloud.png!
    if (desc.includes('sunny') || desc.includes('clear')) return 'icons/sunny.png';
    if (desc.includes('ice') || desc.includes('icy')) return 'icons/icy.png';

    // 6. "unavailable"
    if (desc.includes('Unavailable')) return 'icons/unavailable.png';

    return 'icons/sunny.png';
}

async function fetchWeather() {
    try {
        // Direct fetch from KROC station endpoint
        const response = await fetch(`https://api.weather.gov/stations/${stationId}/observations/latest`, { headers });
        const data = await response.json();

        const tempC = data.properties.temperature.value;
        const textCondition = data.properties.textDescription;

        // 1. Update Temperature in h1
        if (tempC !== null) {
            const tempF = (tempC * 9/5) + 32;
            document.getElementById('currentTemp').innerText = `${Math.round(tempF)}°F`;
        } else {
            document.getElementById('currentTemp').innerText = "N/A";
        }

        // 2. Update Condition Text
        document.getElementById('cond').innerText = textCondition || "Unavailable";

        // 3. Update Image src and alt attributes (Inside the function!)
        const iconElement = document.getElementById('weatherIcon');
        iconElement.src = getWeatherIconPath(textCondition);
        iconElement.alt = textCondition || 'Weather Icon';

    } catch (error) {
        console.error('Error fetching KROC weather:', error);
    }
}

async function fetchHourlyForecast() {
    try {
        const pointRes = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, { headers });
        const pointData = await pointRes.json();
        const hourlyUrl = pointData.properties.forecastHourly;

        const hourlyRes = await fetch(hourlyUrl, { headers });
        const hourlyData = await hourlyRes.json();
        const periods = hourlyData.properties.periods;

        const now = new Date();

        // Filter out past hours by checking if the hour's end time is in the future
        const upcomingPeriods = periods.filter(period => {
            const periodEndTime = new Date(period.endTime);
            return periodEndTime > now;
        });

        const slotsContainer = document.getElementById('hourlySlots');
        slotsContainer.innerHTML = '';

        // Slice the first 3 upcoming hours
        upcomingPeriods.slice(0, 3).forEach(hour => {
    const timeString = new Date(hour.startTime).toLocaleTimeString([], { hour: 'numeric' });
    const description = hour.shortForecast;
    const iconPath = getWeatherIconPath(description);
    
    // Grab precipitation percentage if provided by NWS
    const pop = hour.probabilityOfPrecipitation?.value;
    const popText = pop ? `${pop}%` : '';

    const slot = document.createElement('div');
    slot.className = 'hourly-slot-item';
    slot.innerHTML = `
        <span class="hourly-time">${timeString}</span>
        <img class="hourly-icon" src="${iconPath}" alt="${description}" title="${description}">
        <span class="hourly-temp">${hour.temperature}°${hour.temperatureUnit}</span>
        <span class="hourly-pop">${popText}</span>
        <span class="hourly-desc">${description}</span>
    `;
    slotsContainer.appendChild(slot);
});

    } catch (error) {
        console.error('Error fetching hourly forecast:', error);
    }
}

async function fetchAlmanacData(pointsData) {
    try {
        // The points metadata gives us the URL for the 7-day forecast
        const forecastUrl = pointsData.properties.forecast;
        const response = await fetch(forecastUrl, { headers });
        const forecastData = await response.json();

        // periods[0] is usually today (e.g., "Today" or "This Afternoon")
        const todayPeriod = forecastData.properties.periods[0];
        // periods[1] is usually tonight
        const tonightPeriod = forecastData.properties.periods[1];

        if (todayPeriod && todayPeriod.isDaytime) {
            document.getElementById('todayHigh').innerText = `${todayPeriod.temperature}°F`;
        }
        
        if (tonightPeriod) {
            document.getElementById('todayLow').innerText = `${tonightPeriod.temperature}°F`;
        }

    } catch (error) {
        console.error('Error fetching forecast high/low:', error);
    }
}
async function fetchSunTimes() {
    try {
        const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
        const data = await response.json();

        if (data.status === "OK") {
            const sunriseISO = data.results.sunrise;
            const sunsetISO = data.results.sunset;

            const sunriseLocal = new Date(sunriseISO).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const sunsetLocal = new Date(sunsetISO).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

            document.getElementById('sunriseTime').innerText = sunriseLocal;
            document.getElementById('sunsetTime').innerText = sunsetLocal;
        } else {
            document.getElementById('sunriseTime').innerText = "Unavailable";
            document.getElementById('sunsetTime').innerText = "Unavailable";
        }
    } catch (error) {
        console.error('Error fetching sunrise/sunset:', error);
        document.getElementById('sunriseTime').innerText = "Error";
        document.getElementById('sunsetTime').innerText = "Error";
    }
}

// Update initial loading function to refresh all cards
function updateAllWeatherData() {
    fetchWeather();
    fetchHourlyForecast();
    fetchSunTimes();
}

updateAllWeatherData();
setInterval(updateAllWeatherData, 60000);