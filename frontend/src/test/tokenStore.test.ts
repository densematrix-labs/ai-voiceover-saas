import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTokenStore } from '../lib/tokenStore'

describe('Token Store', () => {
  beforeEach(() => {
    // Reset store state
    useTokenStore.setState({
      totalTokens: 0,
      usedTokens: 0,
      remainingTokens: 0,
      freeTrialAvailable: true,
      freeTrialUsed: false,
      isLoading: false,
      error: null,
    })
  })

  it('initializes with default values', () => {
    const state = useTokenStore.getState()
    
    expect(state.totalTokens).toBe(0)
    expect(state.freeTrialAvailable).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('decrements token correctly', () => {
    useTokenStore.setState({
      totalTokens: 10,
      usedTokens: 3,
      remainingTokens: 7,
    })

    useTokenStore.getState().decrementToken()
    
    const state = useTokenStore.getState()
    expect(state.usedTokens).toBe(4)
    expect(state.remainingTokens).toBe(6)
  })

  it('uses free trial correctly', () => {
    expect(useTokenStore.getState().freeTrialAvailable).toBe(true)
    
    useTokenStore.getState().useFreeTrialNow()
    
    const state = useTokenStore.getState()
    expect(state.freeTrialAvailable).toBe(false)
    expect(state.freeTrialUsed).toBe(true)
  })

  it('does not go below 0 tokens', () => {
    useTokenStore.setState({
      totalTokens: 1,
      usedTokens: 1,
      remainingTokens: 0,
    })

    useTokenStore.getState().decrementToken()
    
    expect(useTokenStore.getState().remainingTokens).toBe(0)
  })

  it('fetches token status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        total_tokens: 20,
        used_tokens: 5,
        remaining_tokens: 15,
        free_trial_available: false,
        free_trial_used: true,
      })
    })

    await useTokenStore.getState().fetchTokenStatus('test-device')
    
    const state = useTokenStore.getState()
    expect(state.totalTokens).toBe(20)
    expect(state.remainingTokens).toBe(15)
    expect(state.freeTrialUsed).toBe(true)
  })

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Server error' })
    })

    await useTokenStore.getState().fetchTokenStatus('test-device')
    
    const state = useTokenStore.getState()
    expect(state.error).toBe('Server error')
    expect(state.isLoading).toBe(false)
  })
})
