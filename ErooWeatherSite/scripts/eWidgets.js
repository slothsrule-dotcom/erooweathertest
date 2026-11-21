const latitude = 43.12;
const longitude = -77.68;

async function fetchWeather() {
    try {
        const response = await fetch('https://api.erooweather.com/api/weather');
        const data = await response.json();

        const numericHigh = parseFloat(data.high);
        const numericLow = parseFloat(data.low);
        const numericAvgHigh = parseFloat(data.avgHigh);
        const numericAvgLow = parseFloat(data.avgLow); 
        
        const today = new Date();
        const todayDateStr = `${today.getMonth() + 1}/${today.getDate()}`;

        const todayCard = Array.isArray(data.sevenDay)
            ? data.sevenDay.find(day => day.date === todayDateStr)
            : null;

        const activeHigh = todayCard ? todayCard.high : data.high;
        const activeLow = todayCard ? todayCard.low : data.low;

        // 1. Handle the High Temperature
        if (activeHigh) {
            document.getElementById('high-temp').textContent = data.high + "°";
            
            const numericHigh = parseFloat(activeHigh);
            const highBox = document.getElementById('temperatureHigh');
            highBox.style.background = getTempColor(numericHigh);

            const descSpan = document.getElementById('highdesc');
            descSpan.textContent = getTempDescription(numericHigh);
            descSpan.style.fontStyle = 'italic';
            descSpan.style.color = getTempDescriptionColor(numericHigh);
        }

        // 2. Handle the Low Temperature
        if (activeLow) {
            document.getElementById('low-temp').textContent = data.low + "°";
            
            const numericLow = parseFloat(data.low);
            const lowBox = document.getElementById('temperatureLow');
            lowBox.style.background = getTempColor(numericLow);

            const descSpan = document.getElementById('lowdesc');

            descSpan.textContent = getTempDescription(numericLow);
            descSpan.style.fontStyle = 'italic';
            descSpan.style.color = getTempDescriptionColor(numericLow);
        }

        // 3. The average temps
        if (data.avgHigh) {
            const avgHighSpan = document.getElementById('avghigh');
            const avgSectionHigh = document.getElementById('avgSectionHigh');

            avgHighSpan.textContent = getAverageComparison(numericHigh, numericAvgHigh);
            avgHighSpan.style.fontStyle = 'italic';
            avgHighSpan.style.color = getAverageComparisonColor(numericHigh, parseFloat(data.avgHigh));

            avgSectionHigh.textContent = "\u00A0" + numericAvgHigh;
        }

        if (data.avgLow) {
            const avgLowSpan = document.getElementById('avglow');
            const avgSectionLow = document.getElementById('avgSectionLow');

            avgLowSpan.textContent = getAverageComparison(numericLow, numericAvgLow);
            avgLowSpan.style.fontStyle = 'italic';
            avgLowSpan.style.color = getAverageComparisonColor(numericLow, parseFloat(data.avgLow));

            avgSectionLow.textContent = "\u00A0" + numericAvgLow;
        }

        // 5. Handle the 7-Day Forecast
        if (data.sevenDay && Array.isArray(data.sevenDay)) {
            const cardPrefixes = ['cardOne', 'cardTwo', 'cardThree', 'cardFour', 'cardFive', 'cardSix', 'cardSeven'];

            data.sevenDay.forEach((dayData, index) => {
                const prefix = cardPrefixes[index];
                if (!prefix) return;

                // Update text and image attributes dynamically
                document.getElementById(`${prefix}High`).textContent = dayData.high + "°";
                document.getElementById(`${prefix}Low`).textContent = dayData.low + "°";
                document.getElementById(`${prefix}Img`).src = dayData.icon;
                document.getElementById(`${prefix}PoP`).textContent = dayData.pop ? dayData.pop + "%" : '';
                document.getElementById(`${prefix}Weekday`).textContent = dayData.weekday;
                document.getElementById(`${prefix}Date`).textContent = dayData.date;
            });
        }

        checkTemperatureTrend(numericHigh);
        fetchSunTimes();
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

async function checkTemperatureTrend(currentTemp) {
    try {
        const headers = {
            'User-Agent': '(myweatherapp.com, contact@myweatherapp.com)',
            'Accept': 'application/geo+json'
        };
        const pointRes = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, { headers });
        const pointData = await pointRes.json();
        const hourlyRes = await fetch(pointData.properties.forecastHourly, { headers });
        const hourlyData = await hourlyRes.json();
        const periods = hourlyData.properties.periods;

        const now = new Date();
        const upcomingPeriods = periods.filter(p => new Date(p.endTime) > now);
        const nextThree = upcomingPeriods.slice(0, 3);

        const sumTemps = nextThree.reduce((sum,period) => sum + period.temperature, 0);
        const avgNextThree = sumTemps / nextThree.length;
        const diff = avgNextThree - currentTemp;
        const arrowElement = document.getElementById('arrow');
        const arrowBox = document.getElementById('temperature3hr');
        const tempChange = document.getElementById('tempChange');

        if (diff >=4) {
            arrowElement.src = 'assets/increase-arrow.png';
            arrowBox.style.background = 'var(--increase)';
            tempChange.textContent = 'increase rapidly';
            tempChange.style.color = '#EF3636';
            tempChange.style.fontStyle = 'italic';
        } else if (diff >= 2){
            arrowElement.src = 'assets/increase-arrow.png';
            arrowBox.style.background = 'var(--increase)';
            tempChange.textContent = 'increase';
            tempChange.style.color = '#EF3636';
            tempChange.style.fontStyle = 'italic';
        } else if (diff <= -4) {
            arrowElement.src = 'assets/decrease-arrow.png';
            arrowBox.style.background = 'var(--decrease)';
            tempChange.textContent = 'decrease rapidly';
            tempChange.style.color = '#3645EF';
            tempChange.style.fontStyle = 'italic';
        } else if (diff <= -2) {
            arrowElement.src = 'assets/decrease-arrow.png';
            arrowBox.style.background = 'var(--decrease)';
            tempChange.textContent = 'decrease';
            tempChange.style.color = '#3645EF';
            tempChange.style.fontStyle = 'italic';
        } else {
            arrowElement.src = 'assets/flat-arrow.png';
            arrowBox.style.background = 'var(--steady)';
            tempChange.textContent = 'stay steady';
            tempChange.style.color = '#EFC436';
            tempChange.style.fontStyle = 'italic';
        }
    } catch (error) {
        console.error('Error calculating temperature trend:', error);
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

            const sunrise = document.getElementById('sunrise');
            const sunset = document.getElementById('sunset');

            sunrise.innerText = "\u00A0" + sunriseLocal;
            sunrise.style.color = 'var(--sunrise)';
            sunset.innerText = "\u00A0" + sunsetLocal;
            sunset.style.color = 'var(--sunset)';
        } else {
            document.getElementById('sunrise').innerText = "\u00A0" + "Unavailable";
            document.getElementById('sunset').innerText = "\u00A0" + "Unavailable";
        }
    } catch (error) {
        console.error('Error fetching sunrise/sunset:', error);
        document.getElementById('sunriseTime').innerText = "Error";
        document.getElementById('sunsetTime').innerText = "Error";
    }
}

function getTempColor(temp) {
    if (temp >=95) {
        return 'var(--scorching)';
    } else if (temp >=86) {
        return 'var(--very-hot)';
    } else if (temp >=80) {
        return 'var(--very-warm)';
    } else if (temp >=70) {
        return 'var(--warm)';
    } else if (temp >=56) {
        return 'var(--mild)';
    } else if (temp >=45) {
        return 'var(--cool)';
    } else if (temp >=28) {
        return 'var(--cold)';
    } else if (temp >=21) {
        return 'var(--very-cold)';
    } else if (temp <21) {
        return 'var(--freezing)';
    }
}

function getTempDescription(temp) {
    if (temp >=95) {
        return "scorching";
    } else if (temp >=86) {
        return "very hot";
    } else if (temp >=80) {
        return "very warm";
    } else if (temp >=70) {
        return "warm";
    } else if (temp >=56) {
        return "mild";
    } else if (temp >=45) {
        return "cool";
    } else if (temp >=28) {
        return "cold";
    } else if (temp >=21) {
        return "very cold";
    } else if (temp <21) {
        return "freezing";
    }
}

function getTempDescriptionColor(temp) {
    if (temp >=95) {
        return 'var(--scorching-text)';
    } else if (temp >=86) {
        return 'var(--very-hot-text)';
    } else if (temp >=80) {
        return 'var(--very-warm-text)';
    } else if (temp >=70) {
        return 'var(--warm-text)';
    } else if (temp >=56) {
        return 'var(--mild-text)';
    } else if (temp >=45) {
        return 'var(--cool-text)';
    } else if (temp >=28) {
        return 'var(--cold-text)';
    } else if (temp >=21) {
        return 'var(--very-cold-text)';
    } else if (temp <21) {
        return 'var(--freezing-text)';
    }
}

function getAverageComparison(temp, avg) {
    const diff = temp - avg;

    if (diff >=10) {
        return "well above";
    } else if (diff >=3) {
        return "above";
    } else if (diff >-3) {
        return "about";
    } else if (diff >-10) {
        return "below";
    } else {
        return "well below";
    }
}

function getAverageComparisonColor(temp, avg) {
    const diff = temp - avg;

    if (diff >=10) return 'var(--very-warm-text)';
    if (diff >=3) return 'var(--warm-text)';
    if (diff >-3) return 'var(--mild-text)';
    if (diff >-10) return 'var(--cool-text)';
    return 'var(--cold-text)';
}
    // Fetch the weather immediately when the page opens
    fetchWeather();