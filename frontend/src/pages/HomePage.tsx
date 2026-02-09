import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getVoices, generateSpeech, previewVoice, Voice } from '../lib/api'
import { getDeviceId } from '../lib/fingerprint'
import { useTokenStore } from '../lib/tokenStore'
import LanguageSwitcher from '../components/LanguageSwitcher'

const SAMPLE_TEXT = "Hello! Welcome to VoiceForge AI, your multi-provider voiceover studio."

export default function HomePage() {
  const { t } = useTranslation()
  const [voices, setVoices] = useState<Voice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [text, setText] = useState('')
  const [speed, setSpeed] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterProvider, setFilterProvider] = useState<string>('')
  const [filterLanguage, setFilterLanguage] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const { remainingTokens, freeTrialAvailable, decrementToken, useFreeTrialNow, fetchTokenStatus } = useTokenStore()

  useEffect(() => {
    loadVoices()
  }, [filterProvider, filterLanguage])

  const loadVoices = async () => {
    try {
      const response = await getVoices(filterProvider, filterLanguage)
      setVoices(response.voices)
      if (!selectedVoice && response.voices.length > 0) {
        setSelectedVoice(response.voices[0])
      }
    } catch (err) {
      console.error('Failed to load voices:', err)
    }
  }

  const handlePreview = async () => {
    if (!selectedVoice) return
    setIsPreviewing(true)
    setError(null)
    
    try {
      const result = await previewVoice(SAMPLE_TEXT, selectedVoice.id, speed)
      if (result.success && result.audio_url) {
        setAudioUrl(result.audio_url)
        audioRef.current?.play()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedVoice || !text.trim()) return
    
    // Check if user has access
    if (!freeTrialAvailable && remainingTokens <= 0) {
      setError(t('errors.noTokens'))
      return
    }

    setIsGenerating(true)
    setError(null)
    
    try {
      const deviceId = await getDeviceId()
      const result = await generateSpeech(text, selectedVoice.id, speed, deviceId)
      
      if (result.success && result.audio_url) {
        setAudioUrl(result.audio_url)
        audioRef.current?.play()
        
        // Update token state
        if (freeTrialAvailable) {
          useFreeTrialNow()
        } else {
          decrementToken()
        }
        
        // Refresh token status
        fetchTokenStatus(deviceId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = freeTrialAvailable || remainingTokens > 0

  return (
    <div className="min-h-screen bg-studio-bg">
      {/* Header */}
      <header className="border-b border-studio-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-studio-neon-cyan to-studio-neon-pink flex items-center justify-center">
              <span className="font-display text-2xl text-studio-bg">V</span>
            </div>
            <h1 className="font-display text-3xl text-studio-neon-cyan neon-text">
              VoiceForge AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/pricing" className="btn-retro text-sm">
              {freeTrialAvailable ? t('cta.freeTrial') : `${remainingTokens} ${t('tokens.remaining')}`}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl md:text-7xl text-white mb-4"
          >
            {t('hero.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-studio-muted text-xl mb-2"
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-8 mt-8"
          >
            <div className="text-center">
              <div className="font-display text-4xl text-studio-neon-cyan">800+</div>
              <div className="text-studio-muted text-sm">{t('stats.voices')}</div>
            </div>
            <div className="w-px h-12 bg-studio-border" />
            <div className="text-center">
              <div className="font-display text-4xl text-studio-neon-pink">50+</div>
              <div className="text-studio-muted text-sm">{t('stats.languages')}</div>
            </div>
            <div className="w-px h-12 bg-studio-border" />
            <div className="text-center">
              <div className="font-display text-4xl text-studio-neon-green">6</div>
              <div className="text-studio-muted text-sm">{t('stats.providers')}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Studio */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Voice Selection */}
          <div className="panel p-6">
            <h3 className="font-display text-2xl text-studio-warm mb-4">{t('studio.selectVoice')}</h3>
            
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <select 
                className="select-retro flex-1 text-sm"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                <option value="">{t('filter.allProviders')}</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Edge TTS">Edge TTS</option>
              </select>
              <select 
                className="select-retro flex-1 text-sm"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
              >
                <option value="">{t('filter.allLanguages')}</option>
                <option value="English">English</option>
                <option value="Chinese">中文</option>
                <option value="Japanese">日本語</option>
                <option value="Korean">한국어</option>
                <option value="German">Deutsch</option>
                <option value="French">Français</option>
                <option value="Spanish">Español</option>
              </select>
            </div>

            {/* Voice List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={`voice-card ${selectedVoice?.id === voice.id ? 'selected' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{voice.name}</div>
                      <div className="text-xs text-studio-muted">
                        {voice.provider} • {voice.language} • {voice.gender}
                      </div>
                    </div>
                    {selectedVoice?.id === voice.id && (
                      <div className="w-3 h-3 rounded-full bg-studio-neon-green" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Button */}
            {selectedVoice && (
              <button
                onClick={handlePreview}
                disabled={isPreviewing}
                className="w-full mt-4 btn-retro text-sm border-studio-neon-pink text-studio-neon-pink hover:bg-studio-neon-pink/20"
              >
                {isPreviewing ? t('studio.previewing') : t('studio.previewVoice')}
              </button>
            )}
          </div>

          {/* Text Input & Generation */}
          <div className="lg:col-span-2 panel p-6">
            <h3 className="font-display text-2xl text-studio-warm mb-4">{t('studio.inputText')}</h3>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('studio.placeholder')}
              className="input-retro h-48 resize-none"
              maxLength={5000}
            />
            
            <div className="flex items-center justify-between mt-2 text-sm text-studio-muted">
              <span>{text.length} / 5000</span>
              <span>{selectedVoice?.name || t('studio.noVoice')}</span>
            </div>

            {/* Speed Control */}
            <div className="mt-6">
              <label className="block text-studio-muted mb-2">
                {t('studio.speed')}: {speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedVoice || !text.trim() || !canGenerate}
              className="w-full mt-6 btn-retro text-lg"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-studio-neon-cyan border-t-transparent rounded-full animate-spin" />
                  {t('studio.generating')}
                </span>
              ) : canGenerate ? (
                t('studio.generate')
              ) : (
                t('studio.buyMore')
              )}
            </button>

            {!canGenerate && (
              <Link to="/pricing" className="block text-center mt-2 text-studio-neon-pink hover:underline">
                {t('cta.getPlan')}
              </Link>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audio Player */}
            <AnimatePresence>
              {audioUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 panel p-4"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="waveform">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i} 
                          className="waveform-bar" 
                          style={{ 
                            height: `${20 + Math.random() * 20}px`,
                            animationDelay: `${i * 0.05}s`
                          }} 
                        />
                      ))}
                    </div>
                    <span className="text-studio-warm font-display text-xl">{t('studio.result')}</span>
                  </div>
                  
                  <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                  
                  <a
                    href={audioUrl}
                    download="voiceover.mp3"
                    className="inline-block mt-4 btn-retro text-sm border-studio-neon-green text-studio-neon-green hover:bg-studio-neon-green/20"
                  >
                    {t('studio.download')}
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-studio-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-studio-muted text-sm">
            © 2026 VoiceForge AI — {t('footer.powered')} DenseMatrix Labs
          </div>
          <div className="flex gap-6 text-sm text-studio-muted">
            <a href="#" className="hover:text-white">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-white">{t('footer.terms')}</a>
            <a href="#" className="hover:text-white">{t('footer.contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
