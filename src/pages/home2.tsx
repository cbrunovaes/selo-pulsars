import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../services/supabaseClient'

type Evento = {
  id: number
  nome: string
  data: string
  horario: string | null
  bandas: string | null
}

// Aceita "24/10/2026" e "2026-10-24" (ou ISO com hora)
function parseData(data: string | null): Date | null {
  if (!data) return null
  const s = data.trim()

  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]))

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

  return null
}

function formatarData(data: string | null) {
  const d = parseData(data)
  if (!d) return { dia: '??', mes: 'EM BREVE', ano: '' }
  return {
    dia: String(d.getDate()).padStart(2, '0'),
    mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
    ano: String(d.getFullYear()),
  }
}

function listarBandas(bandas: string | null) {
  if (!bandas) return []
  return bandas
    .split(/[;,\n]/)
    .map((b) => b.trim())
    .filter(Boolean)
}

function Home() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarEventos() {
      const { data, error } = await supabase.from('eventos').select('*')

      if (error) {
        console.error('Erro ao buscar eventos:', error)
        setErro('Não deu pra carregar os eventos. Tenta de novo.')
      } else {
        const ordenados = ((data ?? []) as Evento[]).sort((a, b) => {
          const ta = parseData(a.data)?.getTime() ?? -Infinity
          const tb = parseData(b.data)?.getTime() ?? -Infinity
          return tb - ta // mais novo primeiro
        })
        setEventos(ordenados)
      }
      setCarregando(false)
    }

    carregarEventos()
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:6px_6px] font-sans text-white">
      {/* Topo */}
      <header className="px-4 pb-8 pt-10 text-center sm:px-5 sm:pb-10 sm:pt-12">
        <p className="inline-block -rotate-2 bg-[#ff2e63] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-black sm:text-xs sm:tracking-[0.3em]">
          ingressos antecipados
        </p>
        <h1 className="mt-4 break-words font-['Permanent_Marker',Impact,sans-serif] text-5xl uppercase leading-none tracking-tight text-[#ffe600] drop-shadow-[3px_3px_0_#ff2e63] sm:text-8xl sm:drop-shadow-[5px_5px_0_#ff2e63]">
          Selo Pulsars
        </h1>
        <p className="mx-auto mt-4 max-w-xs text-xs font-bold uppercase tracking-widest text-white/70 sm:mt-5 sm:max-w-md sm:text-sm">
          Escolhe o rolê, entra na lista, paga o Pix e vem fazer barulho.
        </p>
      </header>

      {/* Fita */}
      <div className="-rotate-1 scale-105 overflow-hidden whitespace-nowrap border-y-4 border-black bg-[#ffe600] py-2 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black sm:text-sm sm:tracking-[0.35em]">
        ★ som alto ★ sem frescura ★ <span className="hidden sm:inline">toca tudo ★ faça você mesmo ★ som alto ★</span>
      </div>

      {/* Lista */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-12">
        <h2 className="mb-8 inline-block border-b-4 border-[#ff2e63] text-xl font-black uppercase tracking-widest sm:text-2xl">
          Próximos rolês
        </h2>

        {carregando && (
          <div className="space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse border-4 border-white/20 bg-white/5" />
            ))}
          </div>
        )}

        {erro && (
          <p className="border-4 border-red-500 bg-red-500/10 p-4 text-sm font-bold uppercase text-red-400" role="alert">
            {erro}
          </p>
        )}

        {!carregando && !erro && eventos.length === 0 && (
          <p className="border-4 border-dashed border-white/40 p-6 text-center text-sm font-bold uppercase tracking-widest text-white/60 sm:p-8">
            Nenhum evento por enquanto. Fica de olho.
          </p>
        )}

        <ul className="space-y-8 sm:space-y-10">
          {eventos.map((evento, i) => {
            const { dia, mes, ano } = formatarData(evento.data)
            const bandas = listarBandas(evento.bandas)

            return (
              <li key={evento.id} className="pr-1.5 sm:pr-2">
                <Link
                  to={`/event/${evento.id}`}
                  className={`group block border-4 border-white bg-[#141414] shadow-[5px_5px_0_#ff2e63] transition duration-150 hover:-translate-y-1 hover:rotate-0 hover:shadow-[8px_8px_0_#ffe600] sm:shadow-[8px_8px_0_#ff2e63] sm:hover:shadow-[12px_12px_0_#ffe600] ${
                    i % 2 === 0 ? 'sm:-rotate-1' : 'sm:rotate-1'
                  }`}
                >
                  <div className="flex">
                    {/* Data */}
                    <div className="flex w-20 shrink-0 flex-col items-center justify-center overflow-hidden border-r-4 border-white bg-[#ffe600] p-2 text-center text-black sm:w-28 sm:p-3">
                      <span className="text-4xl font-black leading-none sm:text-6xl">{dia}</span>
                      <span className="mt-1 text-xs font-black tracking-widest sm:text-sm">{mes}</span>
                      {ano && <span className="text-[10px] font-bold tracking-widest">{ano}</span>}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 p-3 sm:p-4">
                      <h3 className="break-words text-xl font-black uppercase leading-tight tracking-tight sm:text-3xl">
                        {evento.nome}
                      </h3>

                      {evento.horario && (
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#ff2e63] sm:text-xs">
                          Abertura às {evento.horario}
                        </p>
                      )}

                      {bandas.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                          {bandas.map((banda) => (
                            <span
                              key={banda}
                              className="max-w-full break-words border-2 border-white/70 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider sm:px-2 sm:text-xs"
                            >
                              {banda}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Picote do ingresso */}
                  <div className="border-t-4 border-dashed border-white bg-[#ff2e63] px-3 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-black transition group-hover:bg-[#ffe600] sm:px-4 sm:text-sm sm:tracking-[0.25em]">
                    Garantir ingresso →
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>

      <footer className="border-t-4 border-white/10 px-4 py-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 sm:text-xs">
        Apoie a cena local
      </footer>
    </div>
  )
}

export default Home