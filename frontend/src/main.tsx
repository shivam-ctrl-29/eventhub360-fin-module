import '@ant-design/v5-patch-for-react-19'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntApp } from 'antd'
import App from './App'
import { AntdStaticBridge } from './shared/lib/antdStatic'
import './styles/finance.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2 retries with a real backoff so a cold-starting free-tier backend
      // (Render sleeps after ~15 min idle) has a genuine chance to wake up
      // within the retry window instead of the UI giving up and silently
      // showing zeros.
      retry: 2,
      retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15000),
      staleTime: 5 * 60 * 1000,
    },
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
        <AntApp>
          <AntdStaticBridge />
          <App />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
)
