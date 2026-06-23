import axios from "axios"

const BASE = "http://localhost:8000"

export const fetchConditions = (lat, lon) => 
  axios.get(`${BASE}/conditions`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const fetchHistory = (lat, lon) => 
  axios.get(`${BASE}/history`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const fetchAdvisory = (lat, lon) => {
  const url = lat !== undefined && lon !== undefined 
    ? `${BASE}/advisory?lat=${lat}&lon=${lon}` 
    : `${BASE}/advisory`
  return axios.post(url)
}

export const fetchAlert = (lat, lon) => 
  axios.get(`${BASE}/alert`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const fetchForecast = (lat, lon) => 
  axios.get(`${BASE}/forecast`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const fetchAirQuality = (lat, lon) => 
  axios.get(`${BASE}/air-quality`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const fetchDailyForecast = (lat, lon) => 
  axios.get(`${BASE}/daily-forecast`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const updateLocation = (lat, lon, name) => axios.post(`${BASE}/location?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`)

export const searchCities = (query) => axios.get(`${BASE}/search-city?q=${encodeURIComponent(query)}`)

export const fetchOpenMeteoHistory = (lat, lon) => 
  axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,uv_index&timezone=auto&past_days=1&forecast_days=0`)

export const fetchOpenMeteoAqiHistory = (lat, lon) =>
  axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&timezone=auto&past_days=1&forecast_days=0`)

export const fetchOpenMeteoForecast = (lat, lon) => 
  axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code,apparent_temperature&timezone=auto&forecast_days=2`)

export const fetchClusters = (k) => 
  axios.get(`${BASE}/clusters`, { params: k ? { k } : {} })

export const fetchElbow = () => 
  axios.get(`${BASE}/clusters/elbow`)

export const fetchClusterScatter = (sample) => 
  axios.get(`${BASE}/clusters/scatter`, { params: sample ? { sample } : {} })