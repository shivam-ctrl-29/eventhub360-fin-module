import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}

/**
 * Master action button — single source of truth for theme-consistent buttons
 * (Add / Edit / Delete / View / Save / Export / Upload / Filter / Reset, etc.).
 * Styling + hover come from .eh-btn classes in finance.css so the palette stays consistent.
 */
export default function Button({ variant = 'primary', size = 'md', icon, children, className, ...rest }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'eh-btn-sm' : size === 'lg' ? 'eh-btn-lg' : ''
  const cls = ['eh-btn', `eh-btn-${variant}`, sizeClass, className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  )
}
