import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'

// Wrap component with router
const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('LanguageSwitcher', () => {
  it('renders language switcher', () => {
    renderWithRouter(<LanguageSwitcher />)
    
    expect(screen.getByTestId('lang-switcher')).toBeInTheDocument()
  })

  it('shows dropdown on click', () => {
    renderWithRouter(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Should show language options
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('中文')).toBeInTheDocument()
    expect(screen.getByText('日本語')).toBeInTheDocument()
  })

  it('shows all 7 languages', () => {
    renderWithRouter(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const languages = ['English', '中文', '日本語', '한국어', 'Deutsch', 'Français', 'Español']
    languages.forEach(lang => {
      expect(screen.getByText(lang)).toBeInTheDocument()
    })
  })
})
