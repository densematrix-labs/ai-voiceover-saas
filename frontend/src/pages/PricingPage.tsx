import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProducts, createCheckout, Product } from '../lib/api'
import { getDeviceId } from '../lib/fingerprint'
import { useTokenStore } from '../lib/tokenStore'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function PricingPage() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { remainingTokens, freeTrialAvailable } = useTokenStore()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const response = await getProducts()
      setProducts(response.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (productId: string) => {
    setProcessingId(productId)
    setError(null)
    
    try {
      const deviceId = await getDeviceId()
      const successUrl = `${window.location.origin}/payment/success?device_id=${deviceId}`
      const response = await createCheckout(productId, deviceId, successUrl)
      
      // Redirect to Creem checkout
      window.location.href = response.checkout_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setProcessingId(null)
    }
  }

  const getProductHighlight = (productId: string) => {
    switch (productId) {
      case 'basic':
        return { border: 'border-studio-neon-cyan', glow: 'shadow-studio-neon-cyan/20' }
      case 'standard':
        return { border: 'border-studio-neon-pink', glow: 'shadow-studio-neon-pink/30', popular: true }
      case 'pro':
        return { border: 'border-studio-neon-green', glow: 'shadow-studio-neon-green/20' }
      default:
        return { border: 'border-studio-border', glow: '' }
    }
  }

  return (
    <div className="min-h-screen bg-studio-bg">
      {/* Header */}
      <header className="border-b border-studio-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-studio-neon-cyan to-studio-neon-pink flex items-center justify-center">
              <span className="font-display text-2xl text-studio-bg">V</span>
            </div>
            <h1 className="font-display text-3xl text-studio-neon-cyan">VoiceForge AI</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-sm text-studio-muted">
              {freeTrialAvailable 
                ? t('tokens.freeAvailable') 
                : `${remainingTokens} ${t('tokens.remaining')}`
              }
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-5xl md:text-6xl text-white mb-4">
              {t('pricing.title')}
            </h2>
            <p className="text-studio-muted text-xl">
              {t('pricing.subtitle')}
            </p>
          </motion.div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-studio-neon-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {products.map((product, index) => {
                const highlight = getProductHighlight(product.id)
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`panel p-6 relative ${highlight.border} ${highlight.glow ? `shadow-lg ${highlight.glow}` : ''}`}
                  >
                    {highlight.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-studio-neon-pink text-studio-bg font-display text-sm rounded-full">
                        {t('pricing.popular')}
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="font-display text-2xl text-white mb-2">{product.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display text-5xl text-studio-warm">{product.price_formatted}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-studio-neon-green">✓</span>
                        {product.tokens} {t('pricing.generations')}
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-studio-neon-green">✓</span>
                        {t('pricing.allVoices')}
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-studio-neon-green">✓</span>
                        {t('pricing.download')}
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <span className="text-studio-neon-green">✓</span>
                        {t('pricing.commercial')}
                      </li>
                    </ul>

                    <button
                      onClick={() => handlePurchase(product.id)}
                      disabled={processingId !== null}
                      className={`w-full btn-retro ${
                        highlight.popular 
                          ? 'bg-studio-neon-pink/20 border-studio-neon-pink text-studio-neon-pink' 
                          : ''
                      }`}
                    >
                      {processingId === product.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {t('pricing.processing')}
                        </span>
                      ) : (
                        t('pricing.buy')
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <h3 className="font-display text-3xl text-white mb-8">{t('pricing.whyChoose')}</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: '🎙️', title: t('features.multiProvider'), desc: t('features.multiProviderDesc') },
                { icon: '🌍', title: t('features.languages'), desc: t('features.languagesDesc') },
                { icon: '⚡', title: t('features.fast'), desc: t('features.fastDesc') },
                { icon: '💳', title: t('features.noSubscription'), desc: t('features.noSubscriptionDesc') },
              ].map((feature, i) => (
                <div key={i} className="panel p-6">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h4 className="font-display text-xl text-studio-warm mb-2">{feature.title}</h4>
                  <p className="text-studio-muted text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-studio-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-studio-muted text-sm">
          © 2026 VoiceForge AI — {t('footer.powered')} DenseMatrix Labs
        </div>
      </footer>
    </div>
  )
}
