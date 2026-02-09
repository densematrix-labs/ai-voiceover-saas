import { create } from 'zustand'
import { getTokenStatus } from './api'

interface TokenState {
  totalTokens: number
  usedTokens: number
  remainingTokens: number
  freeTrialAvailable: boolean
  freeTrialUsed: boolean
  isLoading: boolean
  error: string | null
  fetchTokenStatus: (deviceId: string) => Promise<void>
  decrementToken: () => void
  useFreeTrialNow: () => void
}

export const useTokenStore = create<TokenState>((set) => ({
  totalTokens: 0,
  usedTokens: 0,
  remainingTokens: 0,
  freeTrialAvailable: true,
  freeTrialUsed: false,
  isLoading: false,
  error: null,

  fetchTokenStatus: async (deviceId: string) => {
    set({ isLoading: true, error: null })
    try {
      const status = await getTokenStatus(deviceId)
      set({
        totalTokens: status.total_tokens,
        usedTokens: status.used_tokens,
        remainingTokens: status.remaining_tokens,
        freeTrialAvailable: status.free_trial_available,
        freeTrialUsed: status.free_trial_used,
        isLoading: false,
      })
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch token status' 
      })
    }
  },

  decrementToken: () => {
    set((state) => ({
      usedTokens: state.usedTokens + 1,
      remainingTokens: Math.max(0, state.remainingTokens - 1),
    }))
  },

  useFreeTrialNow: () => {
    set({
      freeTrialAvailable: false,
      freeTrialUsed: true,
    })
  },
}))
