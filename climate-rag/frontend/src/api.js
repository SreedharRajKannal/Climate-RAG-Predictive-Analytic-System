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

export const fetchComparison = (lat, lon) => 
  axios.get(`${BASE}/comparison`, { params: lat !== undefined && lon !== undefined ? { lat, lon } : {} })

export const updateLocation  = (lat, lon, name) => axios.post(`${BASE}/location?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`)