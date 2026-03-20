import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach access token ─────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor — handle 401 with silent refresh ─────────────────

let isRefreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  queue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
      localStorage.setItem('accessToken', data.accessToken)
      processQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch (err) {
      processQueue(err, null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)
