import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
  // Free-tier hosts (Render, etc.) spin the backend down after ~15 min idle;
  // the first request after that can take 20-40s to wake it back up. 15s was
  // too short and made every cold start look like a hard failure.
  timeout: 40000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const isAuthEndpoint = (url?: string) => !!url && /\/api\/auth\/(login|register)$/.test(url)

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 from the login/register call itself is just "wrong credentials" —
    // let the calling page show its own inline error, don't force a reload.
    if (err.response?.status === 401 && !isAuthEndpoint(err.config?.url)) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
