const API_BASE = import.meta.env.PROD ? '' : ''

export interface Voice {
  id: string
  name: string
  provider: string
  gender: string
  language: string
  locale: string
  description?: string
  available: boolean
}

export interface VoicesResponse {
  voices: Voice[]
  total: number
  providers: Record<string, number>
}

export interface TokenStatus {
  total_tokens: number
  used_tokens: number
  remaining_tokens: number
  free_trial_available: boolean
  free_trial_used: boolean
}

export interface TTSResponse {
  success: boolean
  audio_url?: string
  provider: string
  voice_id: string
  characters_used: number
  error?: string
}

export interface Product {
  id: string
  name: string
  tokens: number
  price: number
  price_formatted: string
}

export interface CheckoutResponse {
  checkout_url: string
  checkout_id: string
}

// Helper to extract error message
function extractErrorMessage(data: Record<string, unknown>): string {
  const detail = data.detail
  if (typeof detail === 'string') {
    return detail
  }
  if (detail && typeof detail === 'object') {
    const detailObj = detail as Record<string, unknown>
    return (detailObj.error as string) || (detailObj.message as string) || 'Request failed'
  }
  return 'Request failed'
}

export async function getVoices(
  provider?: string,
  language?: string,
  gender?: string
): Promise<VoicesResponse> {
  const params = new URLSearchParams()
  if (provider) params.set('provider', provider)
  if (language) params.set('language', language)
  if (gender) params.set('gender', gender)

  const url = `${API_BASE}/api/v1/voices/?${params.toString()}`
  const response = await fetch(url)
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data))
  }
  
  return response.json()
}

export async function generateSpeech(
  text: string,
  voiceId: string,
  speed: number,
  deviceId: string
): Promise<TTSResponse> {
  const response = await fetch(`${API_BASE}/api/v1/tts/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      speed,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data))
  }

  return response.json()
}

export async function previewVoice(
  text: string,
  voiceId: string,
  speed: number = 1.0
): Promise<{ success: boolean; audio_url: string; is_preview: boolean }> {
  const response = await fetch(`${API_BASE}/api/v1/tts/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      speed,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data))
  }

  return response.json()
}

export async function getTokenStatus(deviceId: string): Promise<TokenStatus> {
  const response = await fetch(`${API_BASE}/api/v1/tokens/status`, {
    headers: {
      'X-Device-Id': deviceId,
    },
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data))
  }

  return response.json()
}

export async function getProducts(): Promise<{ products: Product[] }> {
  const response = await fetch(`${API_BASE}/api/v1/payment/products`)
  
  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data))
  }
  
  return response.json()
}

export async function createCheckout(
  productId: string,
  deviceId: string,
  successUrl: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE}/api/v1/payment/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      device_id: deviceId,
      success_url: successUrl,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(extractErrorMessage(data))
  }

  return response.json()
}
