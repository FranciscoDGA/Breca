import type { CSSProperties } from 'react'

/**
 * Paleta do breque. Regra de produto: NUNCA botão verde — verde comunica
 * "seguro", e o app jamais emite veredito de segurança (AGENTS.md regra 1).
 */
export const PALETA = {
  fundo: '#101418',
  superficie: '#1b2027',
  texto: '#f5f1e8',
  textoSuave: '#c9c2b4',
  primaria: '#ffb300',
  primariaTexto: '#241a00',
  borda: '#4a5260',
  alerta: '#ff6b4a',
} as const

export const estiloBotaoPrimario: CSSProperties = {
  backgroundColor: PALETA.primaria,
  color: PALETA.primariaTexto,
  border: 'none',
  borderRadius: 14,
  padding: '20px 24px',
  fontSize: 22,
  fontWeight: 700,
  width: '100%',
  cursor: 'pointer',
}

export const estiloBotaoSecundario: CSSProperties = {
  backgroundColor: 'transparent',
  color: PALETA.texto,
  border: `2px solid ${PALETA.borda}`,
  borderRadius: 14,
  padding: '18px 24px',
  fontSize: 20,
  fontWeight: 600,
  width: '100%',
  cursor: 'pointer',
}

export const estiloBotaoSecundarioDesabilitado: CSSProperties = {
  ...estiloBotaoSecundario,
  color: PALETA.textoSuave,
  border: `2px solid ${PALETA.superficie}`,
  cursor: 'not-allowed',
}
