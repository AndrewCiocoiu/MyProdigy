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
  user1Id: string
  user2Id: string
  sharedWood: number
  sharedStone: number
  sharedCoins: number
  currentCityId: number
  createdAt: string
}

export interface HouseholdInvite {
  id: string
  code: string
  creatorUserId: string
  createdAt: string
  expiresAt: string
  usedAt?: string
}

export interface HouseholdStatusResponse {
  hasHousehold: boolean
  partnershipId?: string
  activeInvite?: HouseholdInvite
  partnerId?: string
  partnerName?: string
  isPartnerOnline: boolean
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

export interface ActiveSession {
  id: string
  householdId: string
  creatorUserId: string
  creatorName: string
  sessionType: "JOINT" | "SOLO"
  durationMinutes: number
  startedAt: string
  expectedEndAt: string
  lobbyExpiresAt: string
  status: "waiting_for_partner" | "session_active" | "solo_active" | "completed" | "aborted"
  participantIds: string[]
}

export interface StartSessionRequest {
  durationMinutes: number
  sessionType?: "JOINT" | "SOLO"
}

export interface FocusSessionHistoryItem {
  id: string
  householdId: string
  userId?: string
  userName?: string
  sessionType: "JOINT" | "SOLO" | "RESCUE"
  durationMins: number
  status: "COMPLETED" | "ABORTED"
  startedAt: string
  endedAt: string
}

export interface FocusSessionHistorySummary {
  totalSessions: number
  completedSessions: number
  abortedSessions: number
  totalFocusMinutes: number
  jointSessions: number
  soloSessions: number
}

export interface FocusSessionHistoryResponse {
  sessions: FocusSessionHistoryItem[]
  summary: FocusSessionHistorySummary
  total: number
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
