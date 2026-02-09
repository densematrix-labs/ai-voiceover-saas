import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import { useTokenStore } from './lib/tokenStore'
import { getDeviceId } from './lib/fingerprint'

function App() {
  const fetchTokenStatus = useTokenStore((state) => state.fetchTokenStatus)

  useEffect(() => {
    const init = async () => {
      const deviceId = await getDeviceId()
      fetchTokenStatus(deviceId)
    }
    init()
  }, [fetchTokenStatus])

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
      </Routes>
    </div>
  )
}

export default App
