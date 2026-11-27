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
    botaoCopia.addEventListener('click', async () => {
      const texto = botaoCopia.getAttribute('data-copiar') || ''
      const aviso = document.getElementById(botaoCopia.getAttribute('data-aviso') || '')
      try {
        await navigator.clipboard.writeText(texto)
        if (aviso) aviso.textContent = 'Copiado neste aparelho. Nada foi enviado.'
      } catch {
        if (aviso) aviso.textContent = 'Não foi possível copiar automaticamente. Selecione o texto manualmente.'
      }
    })
  })
})
