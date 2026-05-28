import { useState, useCallback } from 'react'
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle, Sparkles, Info } from 'lucide-react'
import clsx from 'clsx'
import type { Campanha } from '@/types/campanha'
import { contatosApi } from '@/services/api'

interface Contato {
  nome?: string
  telefone?: string
  email?: string
  empresa?: string
  cargo?: string
  cnpj?: string
  cidade?: string
  estado?: string
  [key: string]: string | undefined
}

interface ColunasDetectadas {
  nome: boolean
  telefone: boolean
  email: boolean
  empresa: boolean
  cargo: boolean
  cnpj: boolean
  cidade: boolean
  estado: boolean
}

type CampoContato = keyof ColunasDetectadas

// Mapeamento flexível de nomes de colunas
const MAPA_COLUNAS = new Map<string, CampoContato>([
  // nome / razão social
  ['nome', 'nome'], ['name', 'nome'],
  ['razao social', 'nome'], ['razao social empresa', 'nome'], ['razaosocial', 'nome'],
  ['nome completo', 'nome'], ['nomecompleto', 'nome'],
  ['contato', 'nome'], ['responsavel', 'nome'], ['nome empresa', 'nome'],
  // telefone
  ['telefone', 'telefone'], ['fone', 'telefone'], ['celular', 'telefone'], ['phone', 'telefone'],
  ['tel', 'telefone'], ['whatsapp', 'telefone'], ['mobile', 'telefone'], ['tel principal', 'telefone'],
  ['telprincipal', 'telefone'],
  // email
  ['email', 'email'], ['e-mail', 'email'], ['e mail', 'email'], ['mail', 'email'],
  ['email comercial', 'email'], ['email corporativo', 'email'],
  // empresa
  ['empresa', 'empresa'], ['company', 'empresa'], ['nome da empresa', 'empresa'], ['nomedaempresa', 'empresa'],
  // cnpj
  ['cnpj', 'cnpj'], ['cpf cnpj', 'cnpj'], ['cpfcnpj', 'cnpj'], ['documento', 'cnpj'],
  // cidade
  ['cidade', 'cidade'], ['municipio', 'cidade'], ['city', 'cidade'],
  // estado
  ['estado', 'estado'], ['uf', 'estado'], ['state', 'estado'],
  // cargo
  ['cargo', 'cargo'], ['funcao', 'cargo'], ['role', 'cargo'],
  ['titulo', 'cargo'], ['cargo funcao', 'cargo'],
])

function detectarSeparador(linha: string): string {
  const contaSemicolon = (linha.match(/;/g) || []).length
  const contaVirgula = (linha.match(/,/g) || []).length
  const contaTab = (linha.match(/\t/g) || []).length
  if (contaSemicolon >= contaVirgula && contaSemicolon >= contaTab) return ';'
  if (contaTab >= contaVirgula) return '\t'
  return ','
}

function normalizarChave(col: string): string {
  return col.trim()
    .replace(/^﻿/, '')           // remove BOM UTF-8
    .replace(/^["']|["']$/g, '')      // remove aspas
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove diacríticos (acentos) — range Unicode correto
    .replace(/[^a-z0-9\s]/g, '')      // remove caracteres especiais restantes
    .trim()
}

function mapearColuna(col: string): CampoContato | null {
  const normalizada = normalizarChave(col)
  return MAPA_COLUNAS.get(normalizada) ?? null
}

const COLUNAS_VAZIAS: ColunasDetectadas = { nome: false, telefone: false, email: false, empresa: false, cargo: false, cnpj: false, cidade: false, estado: false }

function parsePlanilha(texto: string): { contatos: Contato[]; colunas: ColunasDetectadas; colunasOriginais: string[] } {
  const linhas = texto.trim().split(/\r?\n/)
  if (linhas.length < 2) return { contatos: [], colunas: { ...COLUNAS_VAZIAS }, colunasOriginais: [] }

  const separador = detectarSeparador(linhas[0])
  const cabecalhoOriginal = linhas[0].split(separador).map(c => c.trim().replace(/^["'﻿]|["']$/g, ''))
  const mapeamento: (CampoContato | null)[] = cabecalhoOriginal.map(mapearColuna)

  const colunas: ColunasDetectadas = { ...COLUNAS_VAZIAS }
  mapeamento.forEach(m => { if (m) colunas[m] = true })

  const contatos = linhas.slice(1)
    .map(linha => {
      const valores = linha.split(separador).map(v => v.trim().replace(/^["']|["']$/g, ''))
      const obj: Contato = {}
      mapeamento.forEach((campo, i) => {
        if (campo && valores[i]) {
          // Se já mapeou, pega o primeiro valor encontrado
          if (!obj[campo]) obj[campo] = valores[i]
        }
      })
      return obj
    })
    .filter(c => c.telefone || c.nome)

  return { contatos, colunas, colunasOriginais: cabecalhoOriginal }
}

interface Props {
  campanha: Campanha
  onConcluido: (total: number) => void
  onFechar: () => void
}

export default function ModalImportarLista({ campanha, onConcluido, onFechar }: Props) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [colunasDetectadas, setColunasDetectadas] = useState<ColunasDetectadas | null>(null)
  const [colunasOriginais, setColunasOriginais] = useState<string[]>([])
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [fase, setFase] = useState<'idle' | 'preview' | 'importando' | 'concluido'>('idle')
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState('')
  const [dragging, setDragging] = useState(false)
  const [enriquecimento, setEnriquecimento] = useState(false)

  function processarTexto(texto: string) {
    const { contatos: dados, colunas, colunasOriginais: orig } = parsePlanilha(texto)
    if (dados.length === 0) {
      setErro('Nenhum contato encontrado. Verifique se o arquivo tem pelo menos nome ou telefone.')
      return
    }
    if (!colunas.telefone && !colunas.nome) {
      setErro('Não foi possível identificar nome ou telefone. Colunas encontradas: ' + orig.join(', '))
      return
    }
    setContatos(dados)
    setColunasDetectadas(colunas)
    setColunasOriginais(orig)
    setFase('preview')
  }

  function processarArquivo(file: File) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setErro('Aceito arquivos .csv ou .txt. Para Excel (.xlsx), use Arquivo → Salvar Como → CSV.')
      return
    }
    setNomeArquivo(file.name)
    setErro('')

    // Tenta UTF-8 primeiro; se detectar mojibake (Ã, caracteres estranhos), re-lê como Windows-1252
    const readerUtf8 = new FileReader()
    readerUtf8.onload = (e) => {
      const texto = e.target?.result as string
      // Detecta mojibake típico de Windows-1252 lido como UTF-8
      const temMojibake = /Ã|â€|Â|Ã£|Ã§|Ã©|Ã­|Ã³|Ãº/.test(texto.slice(0, 500))
      const temSubstituto = texto.slice(0, 500).includes('�')
      if (temMojibake || temSubstituto) {
        // Re-lê como Windows-1252 (Latin-1)
        const readerLatin = new FileReader()
        readerLatin.onload = (ev) => processarTexto(ev.target?.result as string)
        readerLatin.readAsText(file, 'windows-1252')
      } else {
        processarTexto(texto)
      }
    }
    readerUtf8.readAsText(file, 'UTF-8')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processarArquivo(file)
  }, [])

  const camposFaltando = colunasDetectadas
    ? (['email', 'empresa', 'cargo'] as const).filter(c => !colunasDetectadas[c])
    : []

  async function importar() {
    if (!campanha.id || contatos.length === 0) return
    setFase('importando')
    setProgresso(10)

    try {
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
          enriquecimento_solicitado: enriquecimento,
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
      <div className="bg-white rounded-2xl shadow-popup w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Importar lista de contatos</h2>
            <p className="text-xs text-gray-400 mt-0.5">Campanha: <span className="font-medium text-gray-700">{campanha.nome}</span></p>
          </div>
          <button onClick={onFechar} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <div className="p-6 flex flex-col gap-5">

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
                  dragging ? 'border-brand bg-brand-50' : 'border-gray-200 hover:border-brand hover:bg-brand-50/50'
                )}
              >
                <input
                  id="csv-input" type="file" accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processarArquivo(f) }}
                />
                <Upload size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  {nomeArquivo || 'Clique ou arraste o arquivo CSV'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Detectamos automaticamente as colunas do seu arquivo
                </p>
              </div>

              {/* Colunas detectadas */}
              {colunasDetectadas && fase === 'preview' && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Campos identificados</p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(COLUNAS_VAZIAS) as (keyof ColunasDetectadas)[]).map(campo => (
                      <span key={campo} className={clsx(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        colunasDetectadas[campo]
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-400 line-through'
                      )}>
                        {campo}
                      </span>
                    ))}
                  </div>
                  {colunasOriginais.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Colunas originais: {colunasOriginais.join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {/* Preview tabela */}
              {fase === 'preview' && contatos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={15} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {contatos.length.toLocaleString('pt-BR')} contatos detectados
                    </span>
                    <span className="badge badge-success">Pronto</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Nome','Telefone','Empresa','Cargo'].map(h => (
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

              {/* Enriquecimento */}
              {fase === 'preview' && camposFaltando.length > 0 && (
                <div className={clsx(
                  'rounded-xl border p-4 transition-all',
                  enriquecimento ? 'border-brand bg-brand-50' : 'border-gray-200 bg-gray-50'
                )}>
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className={enriquecimento ? 'text-brand mt-0.5' : 'text-gray-400 mt-0.5'} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Enriquecimento inteligente de contatos</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Completamos automaticamente os dados faltantes para aumentar a taxa de qualificação do agente.
                          </p>
                        </div>
                        <button
                          onClick={() => setEnriquecimento(v => !v)}
                          className={clsx(
                            'w-10 h-5 rounded-full transition-all relative flex-shrink-0',
                            enriquecimento ? 'bg-brand' : 'bg-gray-300'
                          )}
                        >
                          <span className={clsx(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                            enriquecimento ? 'left-5' : 'left-0.5'
                          )} />
                        </button>
                      </div>
                      {enriquecimento && (
                        <div className="flex items-start gap-1.5 mt-3 p-2.5 rounded-lg bg-brand-100">
                          <Info size={12} className="text-brand mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-brand-700">
                            O custo por contato enriquecido será consolidado no seu fechamento mensal junto com a minutagem e demais serviços.
                          </p>
                        </div>
                      )}
                    </div>
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

          {/* Importando */}
          {fase === 'importando' && (
            <div className="py-4 text-center">
              <Loader2 size={32} className="animate-spin text-brand mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-900">Importando contatos...</p>
              <p className="text-xs text-gray-400 mt-1">{progresso}% concluído</p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          )}

          {/* Concluído */}
          {fase === 'concluido' && (
            <div className="py-4 text-center">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900">
                {contatos.length.toLocaleString('pt-BR')} contatos importados!
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {enriquecimento ? 'Enriquecimento em andamento — os dados serão completados em breve.' : 'A campanha já pode ser iniciada.'}
              </p>
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
