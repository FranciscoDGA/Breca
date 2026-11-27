// Menu mobile e botões de cópia: apenas interação do usuário, sem rede e sem persistência.
document.addEventListener('DOMContentLoaded', () => {
  const botao = document.querySelector('[data-menu-toggle]')
  const nav = document.getElementById('nav-principal')

  if (botao && nav) {
    const fechar = () => {
      nav.classList.remove('open')
      botao.setAttribute('aria-expanded', 'false')
      botao.setAttribute('aria-label', 'Abrir menu')
    }

    botao.addEventListener('click', () => {
      const aberto = botao.getAttribute('aria-expanded') === 'true'
      if (aberto) {
        fechar()
        return
      }
      nav.classList.add('open')
      botao.setAttribute('aria-expanded', 'true')
      botao.setAttribute('aria-label', 'Fechar menu')
    })

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', fechar))
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') fechar()
    })
    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && !event.target.closest('header')) fechar()
    })
  }

  document.querySelectorAll('[data-copiar]').forEach((botaoCopia) => {
    const rotuloOriginal = botaoCopia.textContent || 'Copiar'
    botaoCopia.addEventListener('click', async () => {
      const texto = botaoCopia.getAttribute('data-copiar') || ''
      const aviso = document.getElementById(botaoCopia.getAttribute('data-aviso') || '')
      try {
        await navigator.clipboard.writeText(texto)
        botaoCopia.textContent = '✓ Copiado!'
        if (aviso) aviso.textContent = 'Modelo copiado para a área de transferência. Cole (Ctrl+V) no seu e-mail quando quiser enviar — nada foi enviado por este site.'
        window.setTimeout(() => {
          botaoCopia.textContent = rotuloOriginal
        }, 2600)
      } catch {
        if (aviso) aviso.textContent = 'Não foi possível copiar automaticamente. Selecione e copie o modelo exibido acima manualmente.'
      }
    })
  })
})
