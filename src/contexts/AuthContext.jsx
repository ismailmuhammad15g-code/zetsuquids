import { jwtDecode } from 'jwt-decode'
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load user from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token')
        const savedUser = localStorage.getItem('auth_user')

        if (savedToken && savedUser) {
            try {
                // Check if token is expired
                const decoded = jwtDecode(savedToken)
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(savedToken)
                    setUser(JSON.parse(savedUser))
                } else {
                    // Token expired, clear storage
                    logout()
                }
            } catch (error) {
                console.error('Error loading auth:', error)
                logout()
            }
        }
        setLoading(false)
    }, [])

    const login = (newToken, userData) => {
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('auth_token', newToken)
        localStorage.setItem('auth_user', JSON.stringify(userData))
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
    }

    const updateUser = (userData) => {
        setUser(userData)
        localStorage.setItem('auth_user', JSON.stringify(userData))
    }

    const isAuthenticated = () => {
        return !!token && !!user
    }

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
