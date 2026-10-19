import { useEffect, useState, type FormEvent } from 'react'

type Evento = {
  nome: string
  data: string
  horario: string
  bandas: string
  flyer: string | null
}

const SUPABASE_URL = 'https://bwywswbjpdnsyzscuzvl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eXdzd2JqcGRuc3l6c2N1enZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjU0MDYsImV4cCI6MjEwNzg0MTQwNn0.KKa-LK7u0z48sB-5EOM3CW6o-TqYgG-QfecdGCLFl2U'
const MEU_WHATSAPP = '5513996872799'
const MINHA_CHAVE_PIX = 'selopulsars@gmail.com'
const ID_EVENTO_ATUAL = 1

function Home() {
  const [evento, setEvento] = useState<Evento | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregarEvento() {
      try {
        const resposta = await fetch(
          `${SUPABASE_URL}/rest/v1/eventos?id=eq.${ID_EVENTO_ATUAL}&select=*`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          },
        )

        if (!resposta.ok) throw new Error('Erro ao carregar evento')

        const eventos = (await resposta.json()) as Evento[]
        if (!eventos[0]) throw new Error('Evento não encontrado')
        setEvento(eventos[0])
      } catch (error) {
        console.error('Erro ao buscar evento:', error)
        setErro('Erro ao carregar evento')
      }
    }

    carregarEvento()
  }, [])

  async function enviarInscricao(formulario: FormEvent<HTMLFormElement>) {
    formulario.preventDefault()
    setSalvando(true)
    setErro('')

    const dados = new FormData(formulario.currentTarget)
    const nomeInscrito = String(dados.get('inscrito')).trim()
    const contatoInscrito = String(dados.get('contato')).trim()

    try {
      const resposta = await fetch(`${SUPABASE_URL}/rest/v1/ingressos`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          evento_id: ID_EVENTO_ATUAL,
          inscrito: nomeInscrito,
          contato: contatoInscrito,
          status: 'Pendente',
          categoria: 'Antecipado',
        }),
      })

      if (!resposta.ok) {
        const detalhe = (await resposta.json().catch(() => ({}))) as { message?: string }
        throw new Error(detalhe.message || 'Não foi possível salvar o pedido')
      }

      const mensagem = `Olá! Me inscrevi na lista do evento *${evento?.nome}*.\n\n`
        + `*Nome:* ${nomeInscrito}\n`
        + `*Contato:* ${contatoInscrito}\n\n`
        + `Vou realizar o Pix na chave: *${MINHA_CHAVE_PIX}* e enviar o comprovante aqui para confirmar meu ingresso!`

      window.location.href = `https://wa.me/${MEU_WHATSAPP}?text=${encodeURIComponent(mensagem)}`
    } catch (error) {
      setErro(`Erro ao salvar pedido: ${error instanceof Error ? error.message : 'Tente novamente.'}`)
      setSalvando(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#121212] font-sans text-white">
      <div className=" rounded-lg bg-[#1e1e1e] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <h1 className="mt-0 text-[#ff5722]">{evento?.nome ?? (erro || 'Carregando evento...')}</h1>
        {evento && <p>Data: {evento.data} | Horário: {evento.horario}</p>}
        <div className="my-[15px] rounded-md bg-[#2a2a2a] p-3 text-white">
          <strong>Bandas:</strong>
          <p>{evento?.bandas ?? '...'}</p>
          {evento?.flyer && (
            <img
              src={evento.flyer}
              alt={`Flyer de ${evento.nome}`}
              className="mt-3 w-80 rounded object-cover itens-center"
            />
          )}
        </div>
        <form onSubmit={enviarInscricao}>
          <label className="mt-3 block text-sm" htmlFor="inscrito">Seu Nome Completo (para a lista na porta):</label>
          <input className="mt-[5px] box-border w-full rounded border border-[#444] bg-[#121212] p-[10px] text-white" name="inscrito" id="inscrito" required placeholder="Ex: Gustavo Ferreira" />
          <label className="mt-3 block text-sm" htmlFor="contato">Seu WhatsApp ou @ do Instagram:</label>
          <input className="mt-[5px] box-border w-full rounded border border-[#444] bg-[#121212] p-[10px] text-white" name="contato" id="contato" required placeholder="Ex: (13) 99999-9999" />
          <button className="mt-5 w-full cursor-pointer rounded bg-[#25d366] p-3 text-base font-bold text-white disabled:cursor-not-allowed disabled:bg-[#555]" type="submit" disabled={salvando || !evento}>
            {salvando ? 'Salvando seu pedido...' : 'Ir para pagamento'}
          </button>
          {erro && evento && <p className="mt-3 text-red-400" role="alert">{erro}</p>}
        </form>
      </div>
    </div>
  )
}

export default Home