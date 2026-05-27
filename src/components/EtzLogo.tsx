import type { CSSProperties } from 'react'

interface EtzLogoProps {
  size?: number
  loading?: boolean
  className?: string
}

/**
 * EtzLogo v5 — Low-poly wireframe brain (referência: cérebro triangulado)
 *
 * Malha triangular densa com nós brilhantes e glow central radial,
 * fiel à referência do cérebro poligonal holográfico.
 * Base: tronco de árvore sutil (ETZ = עץ = árvore).
 *
 * ViewBox: 74 × 80
 */
export default function EtzLogo({ size = 68, loading = false, className = '' }: EtzLogoProps) {
  const speed  = loading ? 0.5  : 2.2
  const nSpeed = loading ? 0.42 : 1.7

  // ─── Nós da malha (x, y) ───────────────────────────────────────────────
  const N: [number, number][] = [
    [35,  6],  //  0  ápice
    [20, 10],  //  1  frontal-topo-esq
    [50,  8],  //  2  parietal-topo-dir
    [10, 18],  //  3  frontal-superior
    [27, 16],  //  4
    [43, 14],  //  5
    [59, 14],  //  6  occipital-superior
    [ 7, 28],  //  7  frontal
    [18, 26],  //  8
    [31, 24],  //  9
    [46, 22],  // 10
    [62, 22],  // 11  occipital
    [ 8, 38],  // 12  frontal-médio
    [19, 37],  // 13
    [32, 35],  // 14
    [46, 33],  // 15  CORE (centro brilhante)
    [59, 34],  // 16
    [68, 35],  // 17  borda direita
    [10, 48],  // 18  frontal-inferior
    [22, 46],  // 19
    [35, 44],  // 20
    [48, 44],  // 21
    [60, 46],  // 22
    [67, 46],  // 23  borda direita
    [15, 56],  // 24
    [27, 54],  // 25
    [40, 54],  // 26
    [52, 54],  // 27
    [62, 53],  // 28
    [22, 62],  // 29  base esquerda
    [36, 62],  // 30  base centro
    [48, 61],  // 31  base direita
    [57, 58],  // 32
  ]

  // ─── Arestas da triangulação ────────────────────────────────────────────
  const E: [number, number][] = [
    // ápice
    [0,1],[0,2],[1,2],
    // linha 1 → 2
    [1,3],[1,4],[2,4],[2,5],[2,6],[3,4],[4,5],[5,6],
    // linha 2 → 3
    [3,7],[3,8],[4,8],[4,9],[5,9],[5,10],[6,10],[6,11],[7,8],[8,9],[9,10],[10,11],
    // linha 3 → 4
    [7,12],[8,12],[8,13],[9,13],[9,14],[10,14],[10,15],[11,15],[11,16],[16,17],
    [12,13],[13,14],[14,15],[15,16],
    // diagonais extras (densidade central)
    [3,9],[8,14],[9,15],[13,19],[14,20],
    // linha 4 → 5
    [12,18],[13,18],[13,19],[14,19],[14,20],[15,20],[15,21],[16,21],[16,22],[17,22],[17,23],[22,23],
    [18,19],[19,20],[20,21],[21,22],
    // linha 5 → 6
    [18,24],[19,24],[19,25],[20,25],[20,26],[21,26],[21,27],[22,27],[22,28],[23,28],
    [24,25],[25,26],[26,27],[27,28],
    // diagonais extras inferiores
    [19,26],[20,27],[21,28],
    // linha 6 → 7
    [24,29],[25,29],[25,30],[26,30],[26,31],[27,31],[27,32],[28,32],
    [29,30],[30,31],[31,32],
    // fechamento inferior
    [24,30],[26,29],[27,30],[28,31],
  ]

  // ─── Caminhos dos sinais de luz (índices dos nós) ──────────────────────
  function mkPath(...idxs: number[]): string {
    return 'M ' + idxs.map(i => `${N[i][0]},${N[i][1]}`).join(' L ')
  }

  const lightPaths: [string, number, boolean][] = [
    [mkPath(30,26,20,14,9,4,0),   1.6, true ],  // base → ápice (central)
    [mkPath(29,24,18,12,7,3),     1.2, false],  // espinha esquerda
    [mkPath(7,13,15,17),          1.4, true ],  // frontal → occipital
    [mkPath(18,20,10,6,2),        1.2, false],  // diagonal inferior-esq → superior-dir
    [mkPath(32,27,22,16,11),      1.2, false],  // espinha direita
    [mkPath(3,9,15,21,27,32),     1.5, true ],  // diagonal principal
    [mkPath(29,25,19,13,8,4,1),   1.1, false],  // paralela esquerda
    [mkPath(31,26,21,15,10,5,2),  1.1, false],  // paralela direita
  ]

  // ─── Estilos de animação ───────────────────────────────────────────────
  function lightStyle(i: number, bright: boolean): CSSProperties {
    return {
      strokeDasharray: '10 130',
      strokeDashoffset: 12,
      opacity: 0,
      animation: `etz-light ${speed}s cubic-bezier(0.4,0,0.6,1) infinite`,
      animationDelay: `${(i * 0.33 * speed).toFixed(2)}s`,
      filter: bright ? 'url(#egb)' : 'url(#egsm)',
    }
  }

  function nodeStyle(i: number): CSSProperties {
    return {
      animation: `etz-node-pulse ${nSpeed}s ease-in-out infinite`,
      animationDelay: `${((i * 0.14) % 1.0 * nSpeed).toFixed(2)}s`,
      transformBox: 'fill-box',
      transformOrigin: 'center',
    }
  }

  // ─── Categorias de nós (core → big → med → small) ─────────────────────
  const coreSet = new Set([15])
  const bigSet  = new Set([9, 10, 14, 20, 21, 26])
  const medSet  = new Set([4, 5, 6, 8, 13, 16, 19, 25, 27, 30])

  return (
    <svg
      width={size}
      height={Math.round(size * 80 / 74)}
      viewBox="0 0 74 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ETZ"
      role="img"
    >
      <defs>
        {/* Filtros de glow */}
        <filter id="egb" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="egmd" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="egsm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* Glow radial central (emana do core em 46,33) */}
        <radialGradient id="ecg" cx="62%" cy="43%" r="52%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.38"/>
          <stop offset="45%"  stopColor="#7c3aed" stopOpacity="0.14"/>
          <stop offset="80%"  stopColor="#4f46e5" stopOpacity="0.05"/>
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
        </radialGradient>

        {/* Gradiente do tronco */}
        <linearGradient id="etG" x1="36" y1="78" x2="36" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1e1b4b" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
      </defs>

      {/* ── Glow de fundo ─────────────────────────────────────────────────── */}
      <ellipse cx="44" cy="36" rx="36" ry="32" fill="url(#ecg)"/>

      {/* ══════════════════════════════════════════════════════════════════
          MALHA TRIANGULAR — arestas
      ══════════════════════════════════════════════════════════════════ */}
      {E.map(([a, b], i) => (
        <line
          key={`e${i}`}
          x1={N[a][0]} y1={N[a][1]}
          x2={N[b][0]} y2={N[b][1]}
          stroke="#8b5cf6"
          strokeWidth="0.6"
          opacity="0.4"
        />
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          SINAIS DE LUZ ANIMADOS
      ══════════════════════════════════════════════════════════════════ */}
      {lightPaths.map(([d, sw, bright], i) => (
        <path
          key={`lp${i}`}
          d={d}
          stroke="#c4b5fd"
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          style={lightStyle(i, bright)}
        />
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          NÓS DA MALHA — brilham nos vértices
      ══════════════════════════════════════════════════════════════════ */}
      {N.map(([x, y], i) => {
        const isCore = coreSet.has(i)
        const isBig  = bigSet.has(i)
        const isMed  = medSet.has(i)
        const r    = isCore ? 4.0 : isBig ? 2.6 : isMed ? 1.8 : 1.3
        const fill = isCore ? '#7c3aed' : isBig ? '#8b5cf6' : isMed ? '#a78bfa' : '#c4b5fd'
        const filt = isCore ? 'url(#egb)' : isBig ? 'url(#egmd)' : 'url(#egsm)'
        return (
          <circle
            key={`n${i}`}
            cx={x} cy={y}
            r={r}
            fill={fill}
            filter={filt}
            style={nodeStyle(i)}
          />
        )
      })}

      {/* ══════════════════════════════════════════════════════════════════
          TRONCO DE ÁRVORE + RAÍZES  (ETZ = עץ)
      ══════════════════════════════════════════════════════════════════ */}
      <line x1="36" y1="62" x2="36" y2="75"
        stroke="url(#etG)" strokeWidth="3.2" strokeLinecap="round"/>
      {/* Raízes */}
      <line x1="36" y1="72" x2="27" y2="79"
        stroke="#4c1d95" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
      <line x1="36" y1="72" x2="45" y2="79"
        stroke="#4c1d95" strokeWidth="1.8" strokeLinecap="round" opacity="0.85"/>
      <line x1="36" y1="69" x2="23" y2="75"
        stroke="#4c1d95" strokeWidth="1.3" strokeLinecap="round" opacity="0.55"/>
      <line x1="36" y1="69" x2="49" y2="75"
        stroke="#4c1d95" strokeWidth="1.3" strokeLinecap="round" opacity="0.55"/>
    </svg>
  )
}
