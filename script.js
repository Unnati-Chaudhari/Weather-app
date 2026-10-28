const dropSymbol = document.querySelector(".drop_symbol");
const dropdiv = document.querySelector(".drop_div");
const menuDiv = document.querySelector(".menu_div");
const dropDivMenu = document.querySelector(".drop_div_menu");
const searchDiv = document.querySelector(".search_div2");
const searchDropdown = document.querySelector(".search_dropdown");
const weekDays = document.querySelectorAll(".weekday");
const tempVal = document.querySelectorAll(".val_temp");
const speedVal = document.querySelectorAll(".val_speed");
const precipVal = document.querySelectorAll(".val_precip");
const mainDegree = document.querySelector(".deg_main");
const searchBtn = document.querySelector(".search_btn");
const searchInput = document.querySelector(".search");
const cityName = document.querySelector(".city_name");
const searchRecc = document.querySelectorAll(".place");
const dateToday = document.querySelector(".date_today");
const dayName = document.querySelector(".day_name");
const feelsLikeValue = document.querySelector(".feels_like_value");
const windValue = document.querySelector(".wind_value");
const precipValue = document.querySelector(".precip_value");
const humidValue = document.querySelector(".humidity_value");

let hourlyForecast = null;
let selectedTempUnit = "celsius";
let selectedSpeedUnit = "kmh";
let selectedPrecipUnit = "mm";

const weatherCache = new Map();
let latestRequest = 0;

const todayDate = new Date();

dateToday.textContent = todayDate.toLocaleDateString("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const currentDay = todayDate.toLocaleDateString("en-US", {
  weekday: "long",
});

dayName.textContent = currentDay;

searchRecc.forEach((place) => {
  place.addEventListener("click", () => {
    searchInput.value = place.textContent.trim();
    searchDropdown.classList.remove("show_menu");
    weather();
  });
});

dropSymbol.addEventListener("click", () => {
  menuDiv.classList.toggle("show_menu");
});

dropdiv.addEventListener("click", () => {
  dropDivMenu.classList.toggle("show_menu");
});

searchDiv.addEventListener("click", () => {
  searchDropdown.classList.toggle("show_menu");
});

document.addEventListener("click", (e) => {
  if (!menuDiv.contains(e.target) && !dropSymbol.contains(e.target)) {
    menuDiv.classList.remove("show_menu");
  }

  if (!dropdiv.contains(e.target) && !dropDivMenu.contains(e.target)) {
    dropDivMenu.classList.remove("show_menu");
  }

  if (!searchDiv.contains(e.target) && !searchDropdown.contains(e.target)) {
    searchDropdown.classList.remove("show_menu");
  }
});

function setupSelection(options, checkClass) {
  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((item) => {
        const existingCheck = item.querySelector(`.${checkClass}`);

        if (existingCheck) {
          existingCheck.remove();
        }
      });

      const check = document.createElement("div");
      check.classList.add(checkClass);
      option.appendChild(check);
    });
  });
}

setupSelection(tempVal, "check");
setupSelection(speedVal, "check");
setupSelection(precipVal, "check");
setupSelection(weekDays, "tick");

weekDays.forEach((day) => {
  if (day.textContent.trim() === currentDay) {
    day.click();
  }
});

weekDays.forEach((day) => {
  day.addEventListener("click", () => {
    dayName.textContent = day.textContent.trim();
    dropDivMenu.classList.remove("show_menu");
    showHourlyForecast(dayName.textContent);
  });
});

tempVal.forEach((option) => {
  option.addEventListener("click", () => {
    const unit = option.textContent.trim().toLowerCase();

    selectedTempUnit = unit.includes("f")
      ? "fahrenheit"
      : "celsius";

    if (searchInput.value.trim()) {
      weather();
    }
  });
});

speedVal.forEach((option) => {
  option.addEventListener("click", () => {
    const unit = option.textContent.trim().toLowerCase();

    if (unit.includes("mph")) {
      selectedSpeedUnit = "mph";
    } else if (unit.includes("m/s")) {
      selectedSpeedUnit = "ms";
    } else if (unit.includes("knot") || unit === "kn") {
      selectedSpeedUnit = "kn";
    } else {
      selectedSpeedUnit = "kmh";
    }

    if (searchInput.value.trim()) {
      weather();
    }
  });
});

precipVal.forEach((option) => {
  option.addEventListener("click", () => {
    const unit = option.textContent.trim().toLowerCase();

    selectedPrecipUnit =
      unit.includes("inch") ||
      unit.includes("(in)") ||
      unit === "in"
        ? "inch"
        : "mm";

    if (searchInput.value.trim()) {
      weather();
    }
  });
});

function weatherIconPath(code) {
  if (code === 0) {
    return "assets/images/icon-sunny.webp";
  } else if (code === 1 || code === 2) {
    return "assets/images/icon-partly-cloudy.webp";
  } else if (code === 3) {
    return "assets/images/icon-overcast.webp";
  } else if (code === 45 || code === 48) {
    return "assets/images/icon-fog.webp";
  } else if (code >= 51 && code <= 67) {
    return "assets/images/icon-rain.webp";
  } else if (code >= 71 && code <= 77) {
    return "assets/images/icon-snow.webp";
  } else if (code >= 80 && code <= 82) {
    return "assets/images/icon-rain.webp";
  } else if (code === 85 || code === 86) {
    return "assets/images/icon-snow.webp";
  } else if (code >= 95 && code <= 99) {
    return "assets/images/icon-storm.webp";
  }

  return "assets/images/icon-overcast.webp";
}

function showHourlyForecast(selectedDay) {
  if (!hourlyForecast) return;

  const hourlyCards = document.querySelectorAll(".time_container .pm");

  const matchingHours = hourlyForecast.time
    .map((time, index) => ({
      time,
      temperature: hourlyForecast.temperature_2m[index],
      weatherCode: hourlyForecast.weather_code[index],
    }))
    .filter((item) => {
      const date = item.time.slice(0, 10);

      const weekday = new Date(`${date}T12:00:00`)
        .toLocaleDateString("en-US", {
          weekday: "long",
        });

      return weekday.toLowerCase() === selectedDay.trim().toLowerCase();
    });

  hourlyCards.forEach((card, index) => {
    const item = matchingHours[index];

    const timeElement = card.querySelector(".hour_time");
    const tempElement = card.querySelector(".hour_deg");
    const iconElement = card.querySelector(".weather_img_div");

    if (!item) {
      timeElement.textContent = "--";
      tempElement.textContent = "--";
      iconElement.style.backgroundImage = "none";
      return;
    }

    const hour24 = Number(item.time.slice(11, 13));
    const hour12 = hour24 % 12 || 12;
    const period = hour24 >= 12 ? "PM" : "AM";

    timeElement.textContent = `${hour12} ${period}`;

    tempElement.textContent = `${Math.round(item.temperature)}°${
      selectedTempUnit === "celsius" ? "C" : "F"
    }`;

    iconElement.style.backgroundImage =
      `url("${weatherIconPath(item.weatherCode)}")`;

    iconElement.style.backgroundSize = "contain";
    iconElement.style.backgroundRepeat = "no-repeat";
    iconElement.style.backgroundPosition = "center";
  });
}

function showWeeklyForecast(daily) {
  const forecastCards = document.querySelectorAll(".forcast_div .day");

  forecastCards.forEach((card, index) => {
    if (index >= daily.time.length) return;

    const date = new Date(`${daily.time[index]}T12:00:00`);

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "short",
    });

    const dayElement = card.querySelector(".day_two");
    const iconElement = card.querySelector(".day_climate_img");
    const maxTemp = card.querySelector(".deg_div_one");
    const minTemp = card.querySelector(".deg_div_two");

    dayElement.textContent = weekday;

    iconElement.style.backgroundImage =
      `url("${weatherIconPath(daily.weather_code[index])}")`;

    iconElement.style.backgroundSize = "contain";
    iconElement.style.backgroundRepeat = "no-repeat";
    iconElement.style.backgroundPosition = "center";

    const unitSymbol =
      selectedTempUnit === "celsius" ? "°C" : "°F";

    maxTemp.textContent =
      `${Math.round(daily.temperature_2m_max[index])}${unitSymbol}`;

    minTemp.textContent =
      `${Math.round(daily.temperature_2m_min[index])}${unitSymbol}`;
  });
}

async function weather() {
  const city = searchInput.value.trim();

  if (!city) return;

  const requestId = ++latestRequest;

  const cacheKey =
    `${city.toLowerCase()}-${selectedTempUnit}-${selectedSpeedUnit}-${selectedPrecipUnit}`;

  try {
    let data;
    let location;

    if (weatherCache.has(cacheKey)) {
      ({ data, location } = weatherCache.get(cacheKey));
    } else {
      cityName.textContent = "Loading...";

      const geoUrl =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error("Unable to find city.");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        if (requestId === latestRequest) {
          cityName.textContent = "City not found";
        }
        return;
      }

      location = geoData.results[0];

      const apiUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation,apparent_temperature` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&temperature_unit=${selectedTempUnit}` +
        `&wind_speed_unit=${selectedSpeedUnit}` +
        `&precipitation_unit=${selectedPrecipUnit}` +
        `&timezone=auto&forecast_days=7`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Unable to load weather.");
      }

      data = await response.json();

      weatherCache.set(cacheKey, { data, location });
    }

    if (requestId !== latestRequest) return;

    const current = data.current;

    mainDegree.textContent =
      `${current.temperature_2m}°${
        selectedTempUnit === "celsius" ? "C" : "F"
      }`;

    cityName.textContent =
      `${location.name}, ${location.country}`;

    const mainIcon = document.querySelector(".climate_img_main");

    if (mainIcon) {
      mainIcon.style.backgroundImage =
        `url("${weatherIconPath(current.weather_code)}")`;

      mainIcon.style.backgroundSize = "contain";
      mainIcon.style.backgroundRepeat = "no-repeat";
      mainIcon.style.backgroundPosition = "center";
    }

    showWeeklyForecast(data.daily);

    hourlyForecast = data.hourly;
    showHourlyForecast(dayName.textContent.trim());

    feelsLikeValue.textContent =
      `${current.apparent_temperature}°${
        selectedTempUnit === "celsius" ? "C" : "F"
      }`;

    const speedUnitLabel = {
      kmh: "km/h",
      mph: "mph",
      ms: "m/s",
      kn: "kn",
    }[selectedSpeedUnit];

    windValue.textContent =
      `${current.wind_speed_10m} ${speedUnitLabel}`;

    precipValue.textContent =
      `${current.precipitation} ${
        selectedPrecipUnit === "mm" ? "mm" : "in"
      }`;

    humidValue.textContent =
      `${current.relative_humidity_2m}%`;

  } catch (error) {
    if (requestId === latestRequest) {
      console.error("Weather error:", error);
      cityName.textContent = "Weather unavailable";
    }
  }
}

searchBtn.addEventListener("click", weather);

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    weather();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  searchInput.value = "Berlin";
  weather();
});
