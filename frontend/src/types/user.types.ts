export interface User {
    id: string
    email: string
    name?: string
    role: 'doctor' | 'admin'
    is_active?: boolean
    created_at?: string
}

export interface LoginCredentials {
    email: string
    password?: string
}
