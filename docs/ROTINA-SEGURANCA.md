# BREQUE — Rotina Permanente de Segurança (SSDLC)

**Objetivo:** manter a segurança do projeto como processo contínuo e verificável por evidência de teste — nunca como tarefa pontual.

---

## 1. Calendário de Segurança

### Antes de cada publicação (obrigatório)
Executar e exigir aprovação limpa de:

```bash
npm run check:seguranca
npm run test:engine
npm run build
```

O comando `npm run check:seguranca` valida automaticamente:
- **Qualidade/análise estática:** `npm run lint` (`eslint .`)
- **Isolamento do motor puro:** `npm run check:motor` (sem DOM, rede, storage nem tempo real)
- **Integridade do catálogo offline:** `npm run check:catalogo` (fontes HTTPS e datas de verificação)
- **Regressão AppSec e Privacidade:** `vitest run src/breque/seguranca.test.ts src/breque/fase4-privacidade.test.ts` (XSS, `onclick`, Prototype Pollution, RLS, headers, ausência de segredos versionados, zero rede no runtime)
- **Cadeia de suprimentos de produção:** `npm audit --omit=dev` (0 vulnerabilidades em produção)

### Semanalmente
- Rodar `npm audit` (incluindo `devDependencies`) e `npm audit --omit=dev`.
- Verificar avisos de segurança na hospedagem (Vercel) e, quando houver Camada 2+, revisar logs de acesso e padrões anômalos.

### Mensalmente
- Revisar rotas públicas, cabeçalhos HTTP em produção (`curl -I https://breca-rho.vercel.app/app.html`), configurações da Vercel (domínio, HTTPS, variáveis de ambiente) e permissões do repositório.
- Quando houver Camada 2+: auditar papéis, policies RLS, rotas privadas/administrativas e isolamento entre usuários (autorização ≠ autenticação).

### Trimestralmente (alinhado à revisão do catálogo offline — próxima em 27/02/2027)
- Conduzir auditoria profunda (OWASP Top 10 / ASVS) + testes de invasão controlados/autorizados em ambiente local/homologação.
- Revalidar telefones e URLs oficiais em `data/canais-oficiais.json`.
- Revisar ADRs de exceção temporária (como `docs/adr/0014-vulnerabilidades-dev-do-vitest.md`).

### Sempre que houver mudança crítica
- Qualquer introdução de autenticação, banco de dados ativo, APIs, uploads, IA ou pagamentos (Camada 2+) exige nova auditoria completa dos componentes alterados, ADR prévia e testes de autorização/abuso antes de ir ao ar.

---

## 2. Três Regras Inegociáveis de Verificação

1. **Autenticação não é autorização:** validar sempre no servidor e no banco (RLS + menor privilégio) se o usuário autenticado só acessa e altera recursos que lhe pertencem.
2. **Não confiar só no código:** validar também configurações externas (Vercel, DNS/domínio, variáveis de ambiente, Supabase e rotação de chaves).
3. **Exigir evidência real de teste:** nenhuma proteção conta como implementada sem execução verificada de teste automatizado ou validação reproduzível.
