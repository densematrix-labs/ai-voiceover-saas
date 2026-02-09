import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to test the error handling logic
describe('API error handling', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('handles string error detail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: "Something went wrong" })
    })

    // Import dynamically to get fresh module
    const { generateSpeech } = await import('../lib/api')
    
    await expect(generateSpeech('test', 'openai:alloy', 1.0, 'device-1'))
      .rejects.toThrow("Something went wrong")
  })

  it('handles object error detail with error field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ 
        detail: { error: "No tokens remaining", code: "payment_required" }
      })
    })

    const { generateSpeech } = await import('../lib/api')
    
    await expect(generateSpeech('test', 'openai:alloy', 1.0, 'device-1'))
      .rejects.toThrow("No tokens remaining")
  })

  it('handles object error detail with message field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ 
        detail: { message: "Invalid input" }
      })
    })

    const { generateSpeech } = await import('../lib/api')
    
    await expect(generateSpeech('test', 'openai:alloy', 1.0, 'device-1'))
      .rejects.toThrow("Invalid input")
  })

  it('does not throw [object Object]', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ 
        detail: { error: "No tokens", code: "402" }
      })
    })

    const { generateSpeech } = await import('../lib/api')
    
    try {
      await generateSpeech('test', 'openai:alloy', 1.0, 'device-1')
    } catch (e) {
      expect((e as Error).message).not.toContain('[object Object]')
      expect((e as Error).message).not.toContain('object Object')
    }
  })

  it('fetches voices successfully', async () => {
    const mockVoices = {
      voices: [{ id: 'openai:alloy', name: 'Alloy', provider: 'OpenAI' }],
      total: 1,
      providers: { 'OpenAI': 1 }
    }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockVoices)
    })

    const { getVoices } = await import('../lib/api')
    const result = await getVoices()
    
    expect(result.voices).toHaveLength(1)
    expect(result.voices[0].name).toBe('Alloy')
  })

  it('fetches token status successfully', async () => {
    const mockStatus = {
      total_tokens: 10,
      used_tokens: 3,
      remaining_tokens: 7,
      free_trial_available: false,
      free_trial_used: true
    }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatus)
    })

    const { getTokenStatus } = await import('../lib/api')
    const result = await getTokenStatus('device-123')
    
    expect(result.remaining_tokens).toBe(7)
  })

  it('creates checkout successfully', async () => {
    const mockCheckout = {
      checkout_url: 'https://checkout.creem.io/xxx',
      checkout_id: 'checkout-123'
    }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCheckout)
    })

    const { createCheckout } = await import('../lib/api')
    const result = await createCheckout('basic', 'device-123', 'https://example.com/success')
    
    expect(result.checkout_url).toContain('checkout')
  })
})
