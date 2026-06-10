import axios from "axios"

const BASE = "http://localhost:8000"

export const fetchConditions = () => axios.get(`${BASE}/conditions`)
export const fetchHistory    = () => axios.get(`${BASE}/history`)
export const fetchAdvisory   = () => axios.post(`${BASE}/advisory`)
export const fetchAlert      = () => axios.get(`${BASE}/alert`)