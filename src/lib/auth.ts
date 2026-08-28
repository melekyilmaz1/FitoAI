import type { User } from "@/lib/types"

// Normalize email: trim and lowercase
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Sanitize password: ensure string type
export function sanitizePassword(password: string): string {
  return String(password)
}

// Sign up - create new user via API
export async function signUp(
  email: string,
  password: string,
  profileData?: {
    fullName?: string
    dailyCalorieTarget?: number
    targetProteinG?: number
    targetCarbsG?: number
    targetFatG?: number
  }
): Promise<{ user: User | null; error: Error | null }> {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        email: normalizeEmail(email),
        password: sanitizePassword(password),
        ...profileData,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return { user: null, error: new Error(data.error) }
    }

    if (data.user) {
      // Auto sign-in successful - user data includes session
      if (typeof window !== "undefined") {
        localStorage.setItem("custom_user", JSON.stringify(data.user))
        if (data.user.session?.access_token) {
          localStorage.setItem("sb_access_token", data.user.session.access_token)
          localStorage.setItem("sb_refresh_token", data.user.session.refresh_token || "")
        }
      }
      return { user: data.user as User, error: null }
    }

    // Should not happen with new API, but kept for compatibility
    return { user: null, error: null }
  } catch (err: any) {
    console.error("Sign up error:", err)
    return { user: null, error: new Error("Bir hata oluştu. Lütfen tekrar deneyin.") }
  }
}

// Sign in - verify credentials via API
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signin",
        email: normalizeEmail(email),
        password: sanitizePassword(password),
      }),
    })

    const data = await response.json()

    if (data.error) {
      return { user: null, error: new Error(data.error) }
    }

    if (data.user) {
      // Store user in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("custom_user", JSON.stringify(data.user))
        if (data.user.session?.access_token) {
          localStorage.setItem("sb_access_token", data.user.session.access_token)
          localStorage.setItem("sb_refresh_token", data.user.session.refresh_token || "")
        }
      }
      return { user: data.user as User, error: null }
    }

    return { user: null, error: new Error("E-posta adresi veya şifre yanlış.") }
  } catch (err: any) {
    console.error("Sign in error:", err)
    return { user: null, error: new Error("Bir hata oluştu. Lütfen tekrar deneyin.") }
  }
}

// Get user by ID via API
export async function getUserById(userId: string): Promise<User | null> {
  try {
    // With new auth, user is in localStorage
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem("custom_user")
    if (!stored) return null

    const user = JSON.parse(stored) as User
    if (user.id !== userId) return null

    return user
  } catch (err) {
    console.error("Get user error:", err)
    return null
  }
}

// Update user profile (stored in localStorage)
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem("custom_user")
    if (!stored) return null

    const user = JSON.parse(stored) as User
    if (user.id !== userId) return null

    const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() }
    localStorage.setItem("custom_user", JSON.stringify(updatedUser))

    return updatedUser
  } catch (err) {
    console.error("Update user error:", err)
    return null
  }
}

// Sign out - clear local storage
export function signOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("custom_user")
    localStorage.removeItem("sb_access_token")
    localStorage.removeItem("sb_refresh_token")
  }
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem("custom_user")
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}