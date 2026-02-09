import FingerprintJS from '@fingerprintjs/fingerprintjs'

let cachedDeviceId: string | null = null

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId
  }

  try {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    cachedDeviceId = result.visitorId
    return cachedDeviceId
  } catch (error) {
    // Fallback to localStorage
    let storedId = localStorage.getItem('device_id')
    if (!storedId) {
      storedId = 'fallback_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('device_id', storedId)
    }
    cachedDeviceId = storedId
    return cachedDeviceId
  }
}
