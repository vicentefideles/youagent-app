import { useState, useCallback } from 'react'
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import type { Campanha } from '@/types/campanha'
import { contatosApi } from '@/services/api'

interface Contato {
  nome?: string
  telefone?: string
  email?: string
  empresa?: string
  cargo?: string
  [key: string]: string | undefined
}

interface Props {
  campanha: Campanha
  onConcluido: (total: number) => void
  onFechar: () => void
}

function parseCsv(texto: string): Contato[] {
  const linhas = texto.trim().split('\n')
  if (linhas.length < 2) return []
  const cabecalho = linhas[0].split(',').map((c) => c.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))
  return linhas.slice(1)
    .map((linha) => {
      const valores = linha.split(',')
      const obj: Contato = {}
      cabecalho.forEach((col, i) => {
        obj[col] = (valores[i] ?? '').trim().replace(/^["']|["']$/g, '')
      })
      return obj
    })
    .filter((c) => c.telefone || c.nome)
}

export default function ModalImportarLista({ campanha, onConcluido, onFechar }: Props) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [fase, setFase] = useState<'idle' | 'preview' | 'importando' | 'concluido'>('idle')
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState('')
  const [dragging, setDragging] = useState(false)

  function processarArquivo(file: File) {
    if (!file.name.endsWith('.csv')) {
      setErro('Somente arquivos .csv são aceitos.')
      return
    }
    setNomeArquivo(file.name)
    setErro('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const texto = e.target?.result as string
      const dados = parseCsv(texto)
      if (dados.length === 0) {
        setErro('Nenhum contato encontrado. Verifique se o CSV tem as colunas: nome, telefone, email, empresa, cargo')
        return
      }
      setContatos(dados)
      setFase('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processarArquivo(file)
  }, [])

  async function importar() {
    if (!campanha.id || contatos.length === 0) return
    setFase('importando')
    setProgresso(10)

    try {
      // Chunks de 500 (limite do backend)
      const CHUNK = 500
      const total = contatos.length
      let enviados = 0

      for (let i = 0; i < total; i += CHUNK) {
        const chunk = contatos.slice(i, i + CHUNK).map((c) => ({
          nome:     c.nome     || '',
          telefone: c.telefone || '',
          email:    c.email    || '',
          empresa:  c.empresa  || '',
          cargo:    c.cargo    || '',
          campanha_id: campanha.id,
        }))
        await contatosApi.bulkInsert({ contatos: chunk, campanha_id: campanha.id })
        enviados += chunk.length
        setProgresso(Math.round((enviados / total) * 100))
      }

      setFase('concluido')
      setTimeout(() => {
        onConcluido(total)
        onFechar()
      }, 1500)
    } catch {
      setErro('Erro ao importar. Tente novamente.')
      setFase('preview')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-popup w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Importar lista de contatos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Campanha: <span className="font-medium text-gray-700">{campanha.nome}</span></p>
          </div>
          <button onClick={onFechar} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Fase idle / dropzone */}
          {(fase === 'idle' || fase === 'preview') && (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-input')?.click()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all text-center',
                  dragging
                    ? 'border-brand bg-brand-50'
                    : 'border-gray-200 hover:border-brand hover:bg-brand-50/50'
                )}
              >
                <input
                  id="csv-input" type="file" accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processarArquivo(f) }}
                />
                <Upload size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  {nomeArquivo || 'Clique ou arraste o arquivo CSV'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Colunas esperadas: <code className="bg-gray-100 px-1 rounded">nome</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">telefone</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">email</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">empresa</code>{' '}
                  <code className="bg-gray-100 px-1 rounded">cargo</code>
                </p>
              </div>

              {/* Preview */}
              {fase === 'preview' && contatos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={15} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {contatos.length.toLocaleString('pt-BR')} contatos detectados
                    </span>
                    <span className="badge badge-success">Pronto</span>
                  </div>

                  {/* Tabela preview (5 primeiros) */}
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Nome','Telefone','Empresa','Cargo'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {contatos.slice(0, 5).map((c, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700">{c.nome || '—'}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono">{c.telefone || '—'}</td>
                            <td className="px-3 py-2 text-gray-500">{c.empresa || '—'}</td>
                            <td className="px-3 py-2 text-gray-500">{c.cargo || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {contatos.length > 5 && (
                      <p className="text-xs text-center text-gray-400 py-2">
                        + {(contatos.length - 5).toLocaleString('pt-BR')} contatos restantes
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  {erro}
                </div>
              )}
            </>
          )}

          {/* Fase importando */}
          {fase === 'importando' && (
            <div className="py-4 text-center">
              <Loader2 size={32} className="animate-spin text-brand mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-900">Importando contatos...</p>
              <p className="text-xs text-gray-400 mt-1">{progresso}% concluído</p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-300"
                     style={{ width: `${progresso}%` }} />
              </div>
            </div>
          )}

          {/* Fase concluído */}
          {fase === 'concluido' && (
            <div className="py-4 text-center">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">
                {contatos.length.toLocaleString('pt-BR')} contatos importados!
              </p>
              <p className="text-xs text-gray-400 mt-1">A campanha já pode ser iniciada.</p>
            </div>
          )}

          {/* Botões */}
          {(fase === 'idle' || fase === 'preview') && (
            <div className="flex gap-3">
              <button onClick={onFechar} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={importar}
                disabled={contatos.length === 0}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Importar {contatos.length > 0 ? `${contatos.length.toLocaleString('pt-BR')} contatos` : ''}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
