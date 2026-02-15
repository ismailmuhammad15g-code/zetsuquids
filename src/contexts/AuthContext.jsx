import { jwtDecode } from 'jwt-decode'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/api'

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
                // Try to decode as JWT (for email/password login)
                // Supabase OAuth tokens are also JWTs, so this should work
                const decoded = jwtDecode(savedToken)
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(savedToken)
                    setUser(JSON.parse(savedUser))
                    console.log("Auth restored from localStorage:", JSON.parse(savedUser)?.email);
                } else {
                    // Token expired, clear storage
                    console.log("Token expired, clearing auth");
                    if (token || user) logout() // Only logout if we think we are logged in
                    else {
                        localStorage.removeItem('auth_token')
                        localStorage.removeItem('auth_user')
                    }
                }
            } catch (error) {
                // If JWT decode fails, try treating it as Supabase session token
                console.log('Token decode error, attempting OAuth restore:', error.message)
                try {
                    setToken(savedToken)
                    setUser(JSON.parse(savedUser))
                    console.log("Auth restored (OAuth):", JSON.parse(savedUser)?.email);
                } catch (err) {
                    console.error('Error loading auth:', err)
                    logout()
                }
            }
        }
        setLoading(false)
    }, [])

    const login = (newToken, userData) => {
        console.log("AuthContext login called with:", { token: newToken?.substring(0, 20), user: userData?.email });
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('auth_token', newToken)
        localStorage.setItem('auth_user', JSON.stringify(userData))
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        }
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
