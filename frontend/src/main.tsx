import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import App from './App'
import './styles/finance.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
})

const antTheme = {
  token: {
    colorPrimary: '#8B1A1A',
    colorBgBase: '#F5F0EB',
    colorBgContainer: '#FFFFFF',
    colorText: '#334155',
    colorTextHeading: '#1a2a4a',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Menu: {
      itemSelectedBg: 'rgba(139,26,26,0.08)',
      itemSelectedColor: '#8B1A1A',
    },
    Button: {
      colorPrimary: '#8B1A1A',
      colorPrimaryHover: '#6e1515',
    },
    Table: {
      headerBg: '#1a2a4a',
      headerColor: '#FFFFFF',
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antTheme}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
)
