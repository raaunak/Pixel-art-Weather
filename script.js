// ============================================================
//  script.js  –  Pixel Weather App
//  API used: Open-Meteo (free, no key needed)
//    • Geocoding: https://geocoding-api.open-meteo.com
//    • Weather:   https://api.open-meteo.com
// ============================================================


// ── API BASE URLS ────────────────────────────────────────────
const GEO_API     = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';


// ── DOM REFERENCES ───────────────────────────────────────────
// We grab all the elements we'll need to update once, up front.
// It's more efficient than calling querySelector() every time.
const searchInput   = document.querySelector('.search-input');
const searchBtn     = document.querySelector('.search-btn');
const suggestionsEl = document.querySelector('.search-suggestions');
const temperatureEl = document.querySelector('.temperature');
const weatherIconEl = document.querySelector('.weather-icon');
const cityEl        = document.querySelector('.city');
const humidityEl    = document.querySelector('.humidity');
const windEl        = document.querySelector('.wind-speed');
const bubbleEl      = document.querySelector('.speech-bubble');
const proTipEl      = document.querySelector('.pro-tip');
const forecastEl    = document.querySelector('.forecast-slider');
const cardEl        = document.querySelector('.card');
const innerCardEl   = document.querySelector('.inner-card');


// ── WMO WEATHER CODE MAP ─────────────────────────────────────
// Open-Meteo uses the WMO (World Meteorological Organization)
// standard numeric codes to describe weather conditions.
// We map each code to a human label and an icon filename.
// NOTE: adjust the icon filenames to match your /images/weather/ folder.
const WMO_CODES = {
  0:  { label: 'Clear Sky',           icon: 'Sunny'          },
  1:  { label: 'Mainly Clear',        icon: 'Sunny'          },
  2:  { label: 'Partly Cloudy',       icon: 'Partly-Cloudy'  },
  3:  { label: 'Overcast',            icon: 'Cloudy'         },
  45: { label: 'Foggy',               icon: 'Cloudy'         },
  48: { label: 'Icy Fog',             icon: 'Cloudy'         },
  51: { label: 'Light Drizzle',       icon: 'Rain'           },
  53: { label: 'Drizzle',             icon: 'Rain'           },
  55: { label: 'Heavy Drizzle',       icon: 'Rain'           },
  61: { label: 'Light Rain',          icon: 'Rain'           },
  63: { label: 'Rain',                icon: 'Rain'           },
  65: { label: 'Heavy Rain',          icon: 'Rain'           },
  71: { label: 'Light Snow',          icon: 'Snow'           },
  73: { label: 'Snow',                icon: 'Snow'           },
  75: { label: 'Heavy Snow',          icon: 'Snow'           },
  77: { label: 'Snow Grains',         icon: 'Snow'           },
  80: { label: 'Light Showers',       icon: 'Rain'           },
  81: { label: 'Showers',             icon: 'Rain'           },
  82: { label: 'Heavy Showers',       icon: 'Rain'           },
  85: { label: 'Snow Showers',        icon: 'Snow'           },
  86: { label: 'Heavy Snow Showers',  icon: 'Snow'           },
  95: { label: 'Thunderstorm',        icon: 'Thunderstorm'          },
  96: { label: 'Thunderstorm',        icon: 'Thunderstorm'          },
  99: { label: 'Thunderstorm',        icon: 'Thunderstorm'          },
};

// Night variants – when is_day === 0, swap Sunny/Partly-Cloudy for night icons.
// If you don't have a Night.gif, fall back to 'Cloudy'.
const NIGHT_ICON_MAP = {
  'Sunny':         'Night',
  'Partly-Cloudy': 'Night',
};

function getIconSrc(code, isDay) {
  const info = WMO_CODES[code] || { icon: 'Cloudy' };
  let icon = info.icon;
  if (!isDay && NIGHT_ICON_MAP[icon]) icon = NIGHT_ICON_MAP[icon];
  return `images/weather/${icon}.gif`;
}

function getLabel(code) {
  return (WMO_CODES[code] || { label: 'Unknown' }).label;
}


// ── SPEECH BUBBLE MESSAGES ───────────────────────────────────
const BUBBLE_MESSAGES = {
  'Clear Sky':           ['Sunscreen time!', 'Perfect beach day!', "Don't forget your shades!"],
  'Mainly Clear':        ['Pretty sunny out!', 'Nice day ahead!', 'Sunglasses on.'],
  'Partly Cloudy':       ['Mix of sun & clouds.', 'Decent day out!', 'Maybe a light jacket.'],
  'Overcast':            ['Grey skies ahead.', 'Jacket weather!', 'Great day for coffee.'],
  'Foggy':               ["Can barely see!", 'Drive carefully!', 'Spooky fog mode.'],
  'Icy Fog':             ['Ice fog? Wild.', 'Watch your step!', 'Slippery out there.'],
  'Light Drizzle':       ['Just a sprinkle.', 'Grab an umbrella!', 'Damp vibes.'],
  'Drizzle':             ['Drizzle season!', 'Umbrella advised.', 'Puddles incoming.'],
  'Heavy Drizzle':       ['Pretty wet out!', 'Waterproof gear on.', 'Puddle dodge time.'],
  'Light Rain':          ['A bit rainy!', 'Umbrella time!', 'Cosy indoor day.'],
  'Rain':                ['Raining steady!', 'Stay dry!', 'Netflix & rain?'],
  'Heavy Rain':          ['Pouring out there!', 'Stay inside!', 'Flood alert maybe?'],
  'Light Snow':          ['A little snow!', 'Cute flurries!', 'Hot choc time?'],
  'Snow':                ['Snowing!', 'Build a snowman!', 'Roads may be slick.'],
  'Heavy Snow':          ['Blizzard vibes!', 'Stay home if you can.', 'Heavy snowfall!'],
  'Snow Grains':         ['Grainy snow? Weird.', 'Icy pellets!', 'Watch your step.'],
  'Light Showers':       ['Passing showers.', 'Quick umbrella!', 'It may clear up.'],
  'Showers':             ['Scattered showers!', 'On-off rain ahead.', 'Keep an umbrella handy.'],
  'Heavy Showers':       ['Heavy downpours!', 'Seriously, stay dry.', 'Flash flood risk?'],
  'Snow Showers':        ['Snow showers!', 'Flurries possible.', 'Wrap up warm.'],
  'Heavy Snow Showers':  ['Heavy snow showers!', 'Risky roads!', 'Bundle up!'],
  'Thunderstorm':        ['Thunder!', 'Stay indoors!', 'Lightning is wild.'],
  'Unknown':             ['Weather unclear.', 'Check before you go!', 'Stay prepared.'],
};

const PRO_TIPS = [
  'Pro tip: Look Outside',
  'Pro tip: Carry an umbrella',
  'Pro tip: Stay hydrated',
  'Pro tip: Dress in layers',
  'Pro tip: Check before you go',
  'Pro tip: Sunscreen is a vibe',
  'Pro tip: Snow = hot chocolate',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getBubbleMessage(label) {
  const msgs = BUBBLE_MESSAGES[label] || BUBBLE_MESSAGES['Unknown'];
  return randomFrom(msgs);
}


// ── CARD THEMING ─────────────────────────────────────────────
// Dynamically tint the card based on weather + time of day.
function applyCardTheme(code, isDay) {
  let bg      = '#2163FF';
  let innerBg = '#00C9FC';

  if (!isDay) {
    bg = '#0d1b45'; innerBg = '#1a2f6e';
  } else if (code >= 95) {
    bg = '#2d2d54'; innerBg = '#3d3d6e';
  } else if (code >= 61) {
    bg = '#2b5278'; innerBg = '#3a6b9e';
  } else if (code >= 51) {
    bg = '#3a5f8a'; innerBg = '#4d7aaa';
  } else if (code >= 45) {
    bg = '#4a5568'; innerBg = '#718096';
  } else if (code >= 3) {
    bg = '#3a6bc8'; innerBg = '#5a8ce0';
  }

  cardEl.style.background      = bg;
  innerCardEl.style.background = innerBg;
}


// ════════════════════════════════════════════════════════════
//  SEARCH / AUTOCOMPLETE
// ════════════════════════════════════════════════════════════

let geoResults    = [];   // stores the last geocoding API results
let activeIdx     = -1;   // which suggestion is keyboard-highlighted
let debounceTimer = null;

// DEBOUNCING EXPLAINED:
// If we called the API on every single keystroke, a fast typist
// would fire dozens of requests. Debouncing means: "wait 300ms
// after the user STOPS typing, then fire ONE request."
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = searchInput.value.trim();
  if (q.length < 2) { closeSuggestions(); return; }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 300);
});

async function fetchSuggestions(query) {
  try {
    const url  = `${GEO_API}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res  = await fetch(url);
    const data = await res.json();
    geoResults = data.results || [];
    renderSuggestions(geoResults);
  } catch {
    closeSuggestions();
  }
}

function renderSuggestions(results) {
  suggestionsEl.innerHTML = '';
  activeIdx = -1;
  if (!results.length) { closeSuggestions(); return; }

  results.forEach((r) => {
    const btn = document.createElement('button');
    btn.className   = 'search-suggestion';
    btn.type        = 'button';
    btn.textContent = [r.name, r.admin1, r.country].filter(Boolean).join(', ');

    // mousedown fires BEFORE blur, so preventDefault stops the input
    // from losing focus before we can register the click.
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectCity(r);
    });
    suggestionsEl.appendChild(btn);
  });

  suggestionsEl.removeAttribute('hidden');
  suggestionsEl.classList.add('is-open');
}

function closeSuggestions() {
  suggestionsEl.setAttribute('hidden', '');
  suggestionsEl.classList.remove('is-open');
  suggestionsEl.innerHTML = '';
  activeIdx = -1;
}

// Keyboard navigation (↑ ↓ Enter Escape)
searchInput.addEventListener('keydown', (e) => {
  const items = suggestionsEl.querySelectorAll('.search-suggestion');
  if (!items.length) {
    if (e.key === 'Enter') triggerSearch();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIdx = Math.min(activeIdx + 1, items.length - 1);
    highlightActive(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = Math.max(activeIdx - 1, 0);
    highlightActive(items);
  } else if (e.key === 'Enter') {
    if (activeIdx >= 0) selectCity(geoResults[activeIdx]);
    else triggerSearch();
  } else if (e.key === 'Escape') {
    closeSuggestions();
  }
});

function highlightActive(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
}

searchInput.addEventListener('blur', () => setTimeout(closeSuggestions, 150));
searchBtn.addEventListener('click', triggerSearch);

async function triggerSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  try {
    const url  = `${GEO_API}?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.results?.length) selectCity(data.results[0]);
    else bubbleEl.textContent = 'City not found!';
  } catch {
    bubbleEl.textContent = 'Network error!';
  }
}

function selectCity(city) {
  searchInput.value = city.name;
  closeSuggestions();
  fetchWeather(city.latitude, city.longitude, city.name, city.timezone);
}


// ════════════════════════════════════════════════════════════
//  WEATHER FETCH + RENDER
// ════════════════════════════════════════════════════════════

async function fetchWeather(lat, lon, name, timezone) {
  bubbleEl.textContent      = 'Loading…';
  temperatureEl.textContent = '--°C';
  cityEl.textContent        = name;

  try {
    // URLSearchParams builds query strings cleanly – no manual "&" concatenation.
    const url = new URL(WEATHER_API);
    url.searchParams.set('latitude',         lat);
    url.searchParams.set('longitude',        lon);
    // Passing the city's timezone makes ALL timestamps in the response
    // use that city's local time – this is essential for our forecast filter.
    url.searchParams.set('timezone',         timezone);
    url.searchParams.set('wind_speed_unit',  'kmh');
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('forecast_days',    '1');

    // "current" = a single snapshot of right-now conditions
    url.searchParams.set('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'weather_code',
      'is_day',
    ].join(','));

    // "hourly" = one entry per hour for today (00:00 → 23:00, local time)
    url.searchParams.set('hourly', [
      'temperature_2m',
      'weather_code',
      'is_day',
    ].join(','));

    const res  = await fetch(url);
    const data = await res.json();

    renderCurrent(data, name, timezone);
    renderForecast(data, timezone);

  } catch (err) {
    bubbleEl.textContent = 'Failed to load weather.';
    console.error('[Weather] Fetch error:', err);
  }
}

// ── CURRENT CONDITIONS ────────────────────────────────────────
function renderCurrent(data, name, timezone) {
  const c     = data.current;
  const code  = c.weather_code;
  const isDay = c.is_day === 1;
  const label = getLabel(code);

  temperatureEl.textContent = `${Math.round(c.temperature_2m)}°C`;
  weatherIconEl.src         = getIconSrc(code, isDay);
  weatherIconEl.alt         = label;
  cityEl.textContent        = name;
  humidityEl.textContent    = `${c.relative_humidity_2m}%`;
  windEl.textContent        = `${Math.round(c.wind_speed_10m)} km/h`;
  bubbleEl.textContent      = getBubbleMessage(label);
  proTipEl.textContent      = randomFrom(PRO_TIPS);

  applyCardTheme(code, isDay);
}

// ── FORECAST STRIP ────────────────────────────────────────────
//
//  HOW TIME-ACCURATE FILTERING WORKS:
//
//  Open-Meteo returns 24 hourly entries (00:00 → 23:00) in the
//  city's LOCAL timezone (because we set `timezone` in the request).
//
//  To know "what hour is it RIGHT NOW in that city?", we use:
//
//    new Date().toLocaleString('en-US', { timeZone: timezone })
//
//  This converts the current UTC moment into a date-string that
//  represents local time in the city. We then construct a Date
//  from it and read .getHours() to get the current local hour.
//
//  Example: It's 15:00 in Kathmandu (UTC+5:45).
//    → currentHour = 15
//    → We keep only entries where hour >= 15
//    → Forecast shows: Now(15:00), 16:00, 17:00, … 23:00
//
//  Example: It's 07:00 in Toronto (UTC-4 in summer).
//    → currentHour = 7
//    → Forecast shows: Now(07:00), 08:00, … 23:00  ✓
//
function renderForecast(data, timezone) {
  const times  = data.hourly.time;            // ["2025-03-27T00:00", ...]
  const temps  = data.hourly.temperature_2m;
  const codes  = data.hourly.weather_code;
  const isDays = data.hourly.is_day;          // 1 = daytime, 0 = night

  // Get the current local hour in the searched city's timezone
  const nowLocalStr = new Date().toLocaleString('en-US', { timeZone: timezone });
  const nowInCity   = new Date(nowLocalStr);
  const currentHour = nowInCity.getHours();   // 0–23

  // Map each hour's data, then filter to keep only from currentHour onwards
  const entries = times
    .map((t, i) => ({
      // "2025-03-27T15:00" → split on "T" → "15:00" → parseInt → 15
      hour:  parseInt(t.split('T')[1], 10),
      temp:  temps[i],
      code:  codes[i],
      isDay: isDays[i] === 1,
    }))
    .filter(e => e.hour >= currentHour);

  forecastEl.innerHTML = '';

  entries.forEach((entry, idx) => {
    const timeLabel = idx === 0
      ? 'Now'
      : `${String(entry.hour).padStart(2, '0')}:00`;

    const item = document.createElement('div');
    item.className = 'forecast-item' + (idx === 0 ? ' current-time' : '');
    item.innerHTML = `
      <span class="f-time">${timeLabel}</span>
      <img  src="${getIconSrc(entry.code, entry.isDay)}"
            alt="${getLabel(entry.code)}"
            class="f-icon">
      <span class="f-temp">${Math.round(entry.temp)}°</span>
    `;
    forecastEl.appendChild(item);
  });
}


// ════════════════════════════════════════════════════════════
//  INIT – load a default city on page open
// ════════════════════════════════════════════════════════════
// IIFE (Immediately Invoked Function Expression):
// We wrap our startup logic in (async () => { ... })() so we
// can use "await" without needing it inside another async function.
// The (); at the end calls it immediately when the script loads.
(async () => {
  const DEFAULT_CITY = 'Kathmandu';
  try {
    const url  = `${GEO_API}?name=${encodeURIComponent(DEFAULT_CITY)}&count=1&language=en&format=json`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.results?.length) {
      const city = data.results[0];
      fetchWeather(city.latitude, city.longitude, city.name, city.timezone);
    }
  } catch {
    bubbleEl.textContent = 'Search a city to begin!';
  }
})();