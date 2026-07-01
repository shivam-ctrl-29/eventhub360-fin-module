import { createContext, useContext } from 'react'

const AuthScaleContext = createContext(1)

export const AuthScaleProvider = AuthScaleContext.Provider

export function useAuthScale(): number {
  return useContext(AuthScaleContext)
}
