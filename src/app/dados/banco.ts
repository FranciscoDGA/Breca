/**
 * Camada de storage: IndexedDB (equivalente ao Room da spec Android).
 * Nada aqui fala com rede. Tudo fica no aparelho.
 */
const BANCO = 'breca'
const VERSAO = 1

export const LOJAS = {
  eventos: 'eventos',
  avaliacoes: 'avaliacoes',
  breques: 'breques',
  confirmacoes: 'confirmacoes',
  regrasVersao: 'regrasVersao',
  meta: 'meta',
} as const

export type NomeLoja = (typeof LOJAS)[keyof typeof LOJAS]

let promessaBanco: Promise<IDBDatabase> | null = null

export function abrirBanco(): Promise<IDBDatabase> {
  if (promessaBanco !== null) return promessaBanco
  promessaBanco = new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(BANCO, VERSAO)
    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result
      if (!banco.objectStoreNames.contains(LOJAS.eventos)) {
        const loja = banco.createObjectStore(LOJAS.eventos, { keyPath: 'id' })
        loja.createIndex('criadoEm', 'criadoEm')
      }
      if (!banco.objectStoreNames.contains(LOJAS.avaliacoes)) {
        const loja = banco.createObjectStore(LOJAS.avaliacoes, { keyPath: 'id' })
        loja.createIndex('criadoEm', 'criadoEm')
      }
      if (!banco.objectStoreNames.contains(LOJAS.breques)) {
        banco.createObjectStore(LOJAS.breques, { keyPath: 'id' })
      }
      if (!banco.objectStoreNames.contains(LOJAS.confirmacoes)) {
        banco.createObjectStore(LOJAS.confirmacoes, { keyPath: 'id' })
      }
      if (!banco.objectStoreNames.contains(LOJAS.regrasVersao)) {
        banco.createObjectStore(LOJAS.regrasVersao, { keyPath: 'versao' })
      }
      if (!banco.objectStoreNames.contains(LOJAS.meta)) {
        banco.createObjectStore(LOJAS.meta, { keyPath: 'chave' })
      }
    }
    requisicao.onsuccess = () => resolve(requisicao.result)
    requisicao.onerror = () => reject(requisicao.error)
  })
  return promessaBanco
}

function transacao<T>(
  lojas: NomeLoja[],
  modo: IDBTransactionMode,
  operacao: (tx: IDBTransaction) => IDBRequest<T> | void,
): Promise<T> {
  return abrirBanco().then(
    (banco) =>
      new Promise<T>((resolve, reject) => {
        const tx = banco.transaction(lojas, modo)
        let resultado: T
        tx.oncomplete = () => resolve(resultado)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
        const req = operacao(tx)
        if (req !== undefined) req.onsuccess = () => (resultado = req.result)
      }),
  )
}

export async function inserir<T>(loja: NomeLoja, valores: readonly T[]): Promise<void> {
  await transacao([loja], 'readwrite', (tx) => {
    const store = tx.objectStore(loja)
    for (const valor of valores) store.put(valor)
  })
}

export async function listar<T>(loja: NomeLoja): Promise<T[]> {
  return transacao<T[]>([loja], 'readonly', (tx) => tx.objectStore(loja).getAll())
}

export async function obter<T>(loja: NomeLoja, chave: IDBValidKey): Promise<T | undefined> {
  return transacao<T | undefined>([loja], 'readonly', (tx) => tx.objectStore(loja).get(chave))
}

export async function removerPorId(loja: NomeLoja, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return
  await transacao([loja], 'readwrite', (tx) => {
    const store = tx.objectStore(loja)
    for (const id of ids) store.delete(id)
  })
}

export async function limparLoja(loja: NomeLoja): Promise<void> {
  await transacao([loja], 'readwrite', (tx) => tx.objectStore(loja).clear())
}

export async function limparTudo(): Promise<void> {
  for (const loja of Object.values(LOJAS)) {
    await limparLoja(loja)
  }
}
