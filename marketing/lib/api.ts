import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

// Handle 401 responses: try refresh, then redirect to login
let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (token) {
            prom.resolve(token)
        } else {
            prom.reject(error)
        }
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return api(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshToken = localStorage.getItem('refresh_token')
                if (!refreshToken) throw new Error('No refresh token')

                const { data } = await axios.post(`${API_URL}/api/auth/refresh`, null, {
                    params: { refresh_token: refreshToken },
                })

                localStorage.setItem('access_token', data.access_token)
                localStorage.setItem('refresh_token', data.refresh_token)

                processQueue(null, data.access_token)

                originalRequest.headers.Authorization = `Bearer ${data.access_token}`
                return api(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                if (typeof window !== 'undefined') {
                    window.location.href = '/login'
                }
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
