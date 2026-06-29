import { useEffect, useState } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

// Breakpoints: mobile < 768, tablet 768–1199, desktop >= 1200
function readBreakpoint(w: number): Breakpoint {
  if (w < 768) return 'mobile'
  if (w < 1200) return 'tablet'
  return 'desktop'
}

export function useViewport() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440))

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const breakpoint = readBreakpoint(width)
  return {
    width,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  }
}
