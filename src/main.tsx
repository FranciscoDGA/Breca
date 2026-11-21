import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'

const raiz = document.getElementById('root')
if (raiz === null) throw new Error('elemento #root não encontrado')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: o service worker serve apenas o próprio shell offline.
// Nenhum dado do usuário é enviado a lugar algum.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}
