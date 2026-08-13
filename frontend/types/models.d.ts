export interface User {
  id: string
  email: string
  name: string
  householdId?: string
  role?: string
  createdAt: string
}

export interface AuthResponse {
  id: string
  email: string
  name: string
  partnershipId?: string
}

export interface Household {
  id: string
  name: string
  ownerId: string
  petLevel: number
  city: string // e.g., "Hometown", "Rome", "NYC", "Singapore", "SF", "Zurich"
  wood: number
  stone: number
  coins: number
  createdAt: string
  updatedAt: string
}

export interface Pet {
  id: string
  householdId: string
  name: string
  level: number
  experience: number
  status: "healthy" | "sick" | "missing"
  lastInteractionAt: string
}

export interface SoloSession {
  id: string
  userId: string
  startedAt: string
  expectedEndAt: string
  status: "active" | "completed" | "abandoned"
  durationMinutes: number
}

export interface JointSession {
  id: string
  householdId: string
  startedAt: string
  expectedEndAt: string
  status: "waiting_for_partner" | "session_active" | "completed" | "abandoned"
  durationMinutes: number
}

export interface PorchDropoff {
  id: string
  senderId: string
  recipientId: string
  wood: number
  stone: number
  coins: number
  message?: string
  isRead: boolean
  createdAt: string
}
