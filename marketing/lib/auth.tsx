'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useRouter } from 'next/navigation'
import api from './api'

interface User {
    user_id: string
    email: string
    role: string
    tenant_id: string | null
    full_name: string | null
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // On mount, validate the existing token
    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            setIsLoading(false)
            return
        }

        api
            .get('/api/auth/me')
            .then((res) => setUser(res.data))
            .catch(() => {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
            })
            .finally(() => setIsLoading(false))
    }, [])

    const login = useCallback(
        async (email: string, password: string) => {
            const { data } = await api.post('/api/auth/login', { email, password })

            localStorage.setItem('access_token', data.access_token)
            localStorage.setItem('refresh_token', data.refresh_token)
            document.cookie = 'has_session=1; path=/; max-age=604800'

            // Fetch user profile
            const profile = await api.get('/api/auth/me')
            setUser(profile.data)

            router.push('/dashboard')
        },
        [router]
    )

    const logout = useCallback(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        document.cookie = 'has_session=; path=/; max-age=0'
        setUser(null)
        router.push('/login')
    }, [router])

    const value = useMemo(
        () => ({ user, isLoading, login, logout }),
        [user, isLoading, login, logout]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
