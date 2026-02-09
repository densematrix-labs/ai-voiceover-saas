import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTokenStore } from '../lib/tokenStore'

export default function PaymentSuccessPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  
  const { fetchTokenStatus, remainingTokens } = useTokenStore()

  useEffect(() => {
    const loadTokens = async () => {
      const deviceId = searchParams.get('device_id')
      if (deviceId) {
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000))
        await fetchTokenStatus(deviceId)
      }
      setIsLoading(false)
    }
    loadTokens()
  }, [searchParams, fetchTokenStatus])

  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel p-12 max-w-md w-full text-center"
      >
        {isLoading ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-studio-neon-cyan border-t-transparent rounded-full animate-spin" />
            <h1 className="font-display text-3xl text-white mb-2">{t('success.processing')}</h1>
            <p className="text-studio-muted">{t('success.wait')}</p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-studio-neon-green/20 border-2 border-studio-neon-green flex items-center justify-center"
            >
              <span className="text-4xl">✓</span>
            </motion.div>
            
            <h1 className="font-display text-4xl text-white mb-4">{t('success.title')}</h1>
            <p className="text-studio-muted mb-8">{t('success.subtitle')}</p>
            
            <div className="panel p-6 mb-8">
              <div className="font-display text-6xl text-studio-neon-cyan mb-2">
                {remainingTokens}
              </div>
              <div className="text-studio-muted">{t('success.tokensAvailable')}</div>
            </div>

            <Link to="/" className="btn-retro inline-block">
              {t('success.startCreating')}
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}
