import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'
import { listarBandas } from '../utils/eventos'

type EventoAdmin = {
  id: number
  nome: string
  data: string
  horario: string | null
  bandas: string | null
  flyer?: string | null
}

type Ingresso = {
  id: number
  evento_id: number
  inscrito: string
  contato: string | null
  status: string // 'Pendente' | 'Pago' | 'Cancelado'
  categoria: string | null
  estornado: boolean | null
  data_estorno: string | null
}

function AdminPage() {
  // --- AUTENTICAÇÃO ---
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregandoAuth, setCarregandoAuth] = useState(true)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')

  // --- EVENTOS (CRUD) ---
  const [eventos, setEventos] = useState<EventoAdmin[]>([])
  const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(null)
  const [modoFormEvento, setModoFormEvento] = useState<'fechado' | 'criar' | 'editar'>('fechado')
  const [evNome, setEvNome] = useState('')
  const [evData, setEvData] = useState('')
  const [evHorario, setEvHorario] = useState('')
  const [evBandas, setEvBandas] = useState('')
  const [evFlyer, setEvFlyer] = useState('')
  const [salvandoEvento, setSalvandoEvento] = useState(false)

  // --- INGRESSOS ---
  const [ingressos, setIngressos] = useState<Ingresso[]>([])
  const [carregandoIngressos, setCarregandoIngressos] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Pendente' | 'Pago' | 'Cancelado'>('Todos')

  // --- ADICIONAR VIP / STAFF / MANUAL ---
  const [novoNome, setNovoNome] = useState('')
  const [novoContato, setNovoContato] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('VIP / Banda')
  const [novoStatus, setNovoStatus] = useState<'Pago' | 'Pendente'>('Pago')

  const eventoAtual = eventos.find((e) => e.id === eventoSelecionadoId) ?? null
  const bandasDoEvento = listarBandas(eventoAtual?.bandas ?? null)

  // 1. Checar sessão de login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setCarregandoAuth(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // 2. Carregar eventos ao logar
  useEffect(() => {
    if (sessao) {
      carregarEventos()
    }
  }, [sessao])

  // 3. Carregar ingressos quando trocar de evento
  useEffect(() => {
    if (eventoSelecionadoId) {
      carregarIngressos(eventoSelecionadoId)
    } else {
      setIngressos([])
    }
  }, [eventoSelecionadoId])

  async function fazerLogin(e: FormEvent) {
    e.preventDefault()
    setErroLogin('')
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })
    if (error) {
      setErroLogin('E-mail ou senha incorretos.')
    }
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  // --- FUNÇÕES DE EVENTOS ---
  async function carregarEventos() {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      alert('Erro ao carregar eventos: ' + error.message)
      return
    }

    const lista = (data ?? []) as EventoAdmin[]
    setEventos(lista)
    if (lista.length > 0 && !eventoSelecionadoId) {
      setEventoSelecionadoId(lista[0].id)
    } else if (lista.length === 0) {
      setEventoSelecionadoId(null)
    }
  }

  function abrirCriarEvento() {
    setEvNome('')
    setEvData('')
    setEvHorario('')
    setEvBandas('')
    setEvFlyer('')
    setModoFormEvento('criar')
  }

  function abrirEditarEvento() {
    if (!eventoAtual) return
    setEvNome(eventoAtual.nome ?? '')
    setEvData(eventoAtual.data ?? '')
    setEvHorario(eventoAtual.horario ?? '')
    setEvBandas(eventoAtual.bandas ?? '')
    setEvFlyer(eventoAtual.flyer ?? '')
    setModoFormEvento('editar')
  }

  async function salvarEvento(e: FormEvent) {
    e.preventDefault()
    if (!evNome.trim() || !evData.trim()) {
      alert('Preencha pelo menos o Nome e a Data do evento.')
      return
    }

    setSalvandoEvento(true)
    const payload = {
      nome: evNome.trim(),
      data: evData.trim(),
      horario: evHorario.trim() || null,
      bandas: evBandas.trim() || null,
      flyer: evFlyer.trim() || null,
    }

    if (modoFormEvento === 'criar') {
      const { data, error } = await supabase.from('eventos').insert(payload).select().single()
      setSalvandoEvento(false)
      if (error) {
        alert('Erro ao criar evento: ' + error.message)
        return
      }
      setModoFormEvento('fechado')
      await carregarEventos()
      if (data) setEventoSelecionadoId(data.id)
    } else if (modoFormEvento === 'editar' && eventoAtual) {
      const { error } = await supabase.from('eventos').update(payload).eq('id', eventoAtual.id)
      setSalvandoEvento(false)
      if (error) {
        alert('Erro ao atualizar evento: ' + error.message)
        return
      }
      setModoFormEvento('fechado')
      await carregarEventos()
    }
  }

  async function apagarEventoAtual() {
    if (!eventoAtual) return
    const confirmar = window.confirm(
      `ATENÇÃO: Tem certeza que deseja APAGAR o evento "${eventoAtual.nome}" e TODOS os ingressos vinculados a ele? Essa ação não tem volta.`
    )
    if (!confirmar) return

    // Remove primeiro os ingressos vinculados para não esbarrar na Foreign Key
    await supabase.from('ingressos').delete().eq('evento_id', eventoAtual.id)
    const { error } = await supabase.from('eventos').delete().eq('id', eventoAtual.id)

    if (error) {
      alert('Erro ao apagar evento: ' + error.message)
      return
    }

    setEventoSelecionadoId(null)
    await carregarEventos()
  }

  // --- FUNÇÕES DE INGRESSOS ---
  async function carregarIngressos(idEvento: number) {
    setCarregandoIngressos(true)
    const { data, error } = await supabase
      .from('ingressos')
      .select('*')
      .eq('evento_id', idEvento)

    if (error) {
      alert('Erro ao carregar ingressos: ' + error.message)
    } else {
      setIngressos((data ?? []) as Ingresso[])
    }
    setCarregandoIngressos(false)
  }

  async function adicionarPessoaManual(e: FormEvent) {
    e.preventDefault()
    if (!eventoSelecionadoId || !novoNome.trim()) return

    const { error } = await supabase.from('ingressos').insert({
      evento_id: eventoSelecionadoId,
      inscrito: novoNome.trim(),
      contato: novoContato.trim() || 'Lista Interna',
      categoria: novaCategoria,
      status: novoStatus,
      estornado: false,
    })

    if (error) {
      alert('Erro ao adicionar nome: ' + error.message)
      return
    }

    setNovoNome('')
    setNovoContato('')
    carregarIngressos(eventoSelecionadoId)
  }

  async function confirmarPagamento(idIngresso: number) {
    if (!eventoSelecionadoId) return
    const { error } = await supabase
      .from('ingressos')
      .update({ status: 'Pago', estornado: false, data_estorno: null })
      .eq('id', idIngresso)

    if (error) alert('Erro ao confirmar: ' + error.message)
    else carregarIngressos(eventoSelecionadoId)
  }

  async function cancelarIngresso(ingresso: Ingresso) {
    if (!eventoSelecionadoId) return
    const foiEstornado = window.confirm(
      `Cancelar o ingresso de "${ingresso.inscrito}".\n\nClique em OK se houve ESTORNO do Pix (Estornado = true), ou Cancelar se apenas desistiu sem estorno.`
    )
    const hoje = new Date().toLocaleDateString('pt-BR')

    const { error } = await supabase
      .from('ingressos')
      .update({
        status: 'Cancelado',
        estornado: foiEstornado,
        data_estorno: foiEstornado ? hoje : null,
      })
      .eq('id', ingresso.id)

    if (error) alert('Erro ao cancelar: ' + error.message)
    else carregarIngressos(eventoSelecionadoId)
  }

  async function editarNomeIngresso(ingresso: Ingresso) {
    if (!eventoSelecionadoId) return
    const novoTexto = window.prompt('Editar nome do inscrito:', ingresso.inscrito)
    if (!novoTexto || !novoTexto.trim()) return

    const { error } = await supabase
      .from('ingressos')
      .update({ inscrito: novoTexto.trim() })
      .eq('id', ingresso.id)

    if (error) alert('Erro ao editar: ' + error.message)
    else carregarIngressos(eventoSelecionadoId)
  }

  async function apagarIngresso(ingresso: Ingresso) {
    if (!eventoSelecionadoId) return
    if (!window.confirm(`Apagar permanentemente "${ingresso.inscrito}" da lista?`)) return

    const { error } = await supabase.from('ingressos').delete().eq('id', ingresso.id)
    if (error) alert('Erro ao apagar: ' + error.message)
    else carregarIngressos(eventoSelecionadoId)
  }

  // --- ORDENAÇÃO ALFABÉTICA E FILTROS ---
  const ingressosOrdenados = [...ingressos].sort((a, b) =>
    (a.inscrito ?? '').localeCompare(b.inscrito ?? '', 'pt-BR', { sensitivity: 'base' })
  )

  const ingressosFiltrados = ingressosOrdenados.filter((ing) => {
    const bateStatus = filtroStatus === 'Todos' || ing.status === filtroStatus
    const termo = busca.trim().toLowerCase()
    const bateBusca =
      !termo ||
      ing.inscrito?.toLowerCase().includes(termo) ||
      ing.contato?.toLowerCase().includes(termo) ||
      ing.categoria?.toLowerCase().includes(termo)
    return bateStatus && bateBusca
  })

  // Apenas quem está Pago entra na folha de impressão da portaria
  const listaPortaria = ingressosOrdenados.filter((i) => i.status === 'Pago')

  const totalPagos = ingressos.filter((i) => i.status === 'Pago' && i.categoria === 'Antecipado').length
  const totalVipStaff = ingressos.filter((i) => i.status === 'Pago' && i.categoria !== 'Antecipado').length
  const totalPendentes = ingressos.filter((i) => i.status === 'Pendente').length
  const totalCancelados = ingressos.filter((i) => i.status === 'Cancelado').length

  if (carregandoAuth) {
    return <div className="min-h-screen bg-[#0a0a0a] p-10 text-center font-bold text-white">Carregando...</div>
  }

  // ==========================================
  // TELA DE LOGIN (SE NÃO ESTIVER LOGADO)
  // ==========================================
  if (!sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-white">
        <div className="w-full max-w-md border-4 border-white bg-[#141414] p-6 shadow-[8px_8px_0_#ff2e63]">
          <h1 className="font-['Permanent_Marker',Impact,sans-serif] text-3xl uppercase text-[#ffe600]">
            QG Selo Pulsars
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">
            Acesso restrito da organização
          </p>

          <form onSubmit={fazerLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border-4 border-white bg-black p-3 font-bold text-white focus:border-[#ffe600] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 w-full border-4 border-white bg-black p-3 font-bold text-white focus:border-[#ffe600] focus:outline-none"
              />
            </div>

            {erroLogin && (
              <p className="border-2 border-red-500 bg-red-500/10 p-2 text-xs font-bold text-red-400">
                {erroLogin}
              </p>
            )}

            <button
              type="submit"
              className="w-full cursor-pointer border-4 border-white bg-[#ffe600] py-3 font-black uppercase tracking-widest text-black shadow-[4px_4px_0_#ff2e63]"
            >
              Entrar no Painel
            </button>
          </form>

          <Link to="/" className="mt-6 block text-center text-xs font-bold uppercase text-white/50 hover:text-white">
            ← Voltar para a página pública
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================
  // PAINEL ADMIN + FOLHA DE IMPRESSÃO
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white print:bg-white print:text-black">
      {/* TUDO DENTRO DE print:hidden SOME NA HORA DE IMPRIMIR (CTRL + P) */}
      <div className="mx-auto max-w-5xl px-4 py-8 print:hidden">
        {/* Topo Admin */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-white pb-4">
          <div>
            <h1 className="font-['Permanent_Marker',Impact,sans-serif] text-3xl uppercase text-[#ffe600]">
              Painel Admin • Pulsars
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              Controle de Eventos, Pix e Lista da Portaria
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="border-2 border-white px-3 py-2 text-xs font-black uppercase hover:bg-white hover:text-black"
            >
              Ver Site
            </Link>
            <button
              onClick={sair}
              className="cursor-pointer border-2 border-red-500 px-3 py-2 text-xs font-black uppercase text-red-400 hover:bg-red-500 hover:text-black"
            >
              Sair
            </button>
          </div>
        </header>

        {/* 1. CONTROLE DE EVENTOS (SELECIONAR / CRIAR / EDITAR / APAGAR) */}
        <section className="mt-6 border-4 border-white bg-[#141414] p-4 shadow-[6px_6px_0_#ff2e63]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[240px] flex-1">
              <label className="text-xs font-black uppercase tracking-widest text-[#ffe600]">
                Evento Selecionado
              </label>
              <select
                value={eventoSelecionadoId ?? ''}
                onChange={(e) => setEventoSelecionadoId(Number(e.target.value))}
                className="mt-1 w-full border-4 border-white bg-black p-3 text-base font-black uppercase text-white"
              >
                {eventos.length === 0 && <option value="">Nenhum evento cadastrado</option>}
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    #{ev.id} - {ev.nome} ({ev.data})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={abrirCriarEvento}
                className="cursor-pointer border-2 border-white bg-[#25d366] px-3 py-3 text-xs font-black uppercase text-black"
              >
                + Novo Evento
              </button>
              {eventoAtual && (
                <>
                  <button
                    onClick={abrirEditarEvento}
                    className="cursor-pointer border-2 border-white bg-[#ffe600] px-3 py-3 text-xs font-black uppercase text-black"
                  >
                    Editar Evento
                  </button>
                  <button
                    onClick={apagarEventoAtual}
                    className="cursor-pointer border-2 border-red-500 bg-black px-3 py-3 text-xs font-black uppercase text-red-400 hover:bg-red-500 hover:text-black"
                  >
                    Apagar Evento
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Formulário de Criar / Editar Evento */}
          {modoFormEvento !== 'fechado' && (
            <form onSubmit={salvarEvento} className="mt-6 border-t-4 border-dashed border-white/30 pt-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#ff2e63]">
                {modoFormEvento === 'criar' ? 'Cadastrar Novo Evento' : `Editando: ${eventoAtual?.nome}`}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase">Nome do Rolê *</label>
                  <input
                    required
                    value={evNome}
                    onChange={(e) => setEvNome(e.target.value)}
                    placeholder="Ex: Ovo Frito #4"
                    className="mt-1 w-full border-2 border-white bg-black p-2 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">Data (DD/MM/AAAA) *</label>
                  <input
                    required
                    value={evData}
                    onChange={(e) => setEvData(e.target.value)}
                    placeholder="Ex: 24/10/2026"
                    className="mt-1 w-full border-2 border-white bg-black p-2 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">Horário</label>
                  <input
                    value={evHorario}
                    onChange={(e) => setEvHorario(e.target.value)}
                    placeholder="Ex: 22h"
                    className="mt-1 w-full border-2 border-white bg-black p-2 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">Link da Imagem do Flyer (URL)</label>
                  <input
                    value={evFlyer}
                    onChange={(e) => setEvFlyer(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full border-2 border-white bg-black p-2 text-sm font-bold text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase">Bandas (separadas por vírgula)</label>
                  <input
                    value={evBandas}
                    onChange={(e) => setEvBandas(e.target.value)}
                    placeholder="Ex: Bardum, Panta Rei, Cursed Cult"
                    className="mt-1 w-full border-2 border-white bg-black p-2 text-sm font-bold text-white"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={salvandoEvento}
                  className="cursor-pointer border-2 border-white bg-[#ffe600] px-4 py-2 text-xs font-black uppercase text-black"
                >
                  {salvandoEvento ? 'Salvando...' : 'Salvar Evento'}
                </button>
                <button
                  type="button"
                  onClick={() => setModoFormEvento('fechado')}
                  className="cursor-pointer border-2 border-white/50 px-4 py-2 text-xs font-black uppercase text-white/70"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>

        {eventoAtual && (
          <>
            {/* 2. PLACAR DO EVENTO + BOTÃO IMPRIMIR */}
            <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="border-2 border-white bg-[#141414] p-3 text-center">
                <span className="block text-2xl font-black text-[#25d366]">{totalPagos}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Antecipados Pagos</span>
              </div>
              <div className="border-2 border-white bg-[#141414] p-3 text-center">
                <span className="block text-2xl font-black text-[#ffe600]">{totalPendentes}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Pendentes (Pix)</span>
              </div>
              <div className="border-2 border-white bg-[#141414] p-3 text-center">
                <span className="block text-2xl font-black text-cyan-400">{totalVipStaff}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">VIP / Staff</span>
              </div>
              <div className="border-2 border-white bg-[#141414] p-3 text-center">
                <span className="block text-2xl font-black text-red-400">{totalCancelados}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Cancelados</span>
              </div>
              <button
                onClick={() => window.print()}
                className="col-span-2 cursor-pointer border-4 border-white bg-[#ffe600] p-3 text-center text-xs font-black uppercase tracking-widest text-black shadow-[4px_4px_0_#ff2e63] hover:bg-white sm:col-span-1"
              >
                🖨️ Imprimir Lista ({listaPortaria.length})
              </button>
            </section>

            {/* 3. CADASTRO MANUAL (VIP / BANDA / STAFF / ANTECIPADO) */}
            <section className="mt-6 border-4 border-white bg-[#141414] p-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ffe600]">
                + Adicionar Nome na Lista (VIP, Staff ou Pagamento Manual)
              </h2>
              <form onSubmit={adicionarPessoaManual} className="mt-3 grid gap-3 sm:grid-cols-5">
                <input
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome completo..."
                  className="border-2 border-white bg-black p-2 text-sm font-bold text-white sm:col-span-2"
                />
                <input
                  value={novoContato}
                  onChange={(e) => setNovoContato(e.target.value)}
                  placeholder="Tel / @insta / Obs..."
                  className="border-2 border-white bg-black p-2 text-sm font-bold text-white"
                />
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  className="border-2 border-white bg-black p-2 text-sm font-bold text-white"
                >
                  <option value="Antecipado">Antecipado (Pagante)</option>
                  <option value="Staff / Selo">Staff / Selo Pulsars</option>
                  <option value="Fotografia">Fotografia / Mídia</option>
                  <option value="VIP / Convidado">VIP Geral</option>
                  {bandasDoEvento.map((b) => (
                    <option key={b} value={`VIP - ${b}`}>
                      VIP Banda: {b}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    value={novoStatus}
                    onChange={(e) => setNovoStatus(e.target.value as 'Pago' | 'Pendente')}
                    className="w-full border-2 border-white bg-black p-2 text-xs font-bold text-white"
                  >
                    <option value="Pago">Já Confirmado</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                  <button
                    type="submit"
                    className="cursor-pointer border-2 border-white bg-[#ff2e63] px-4 py-2 text-xs font-black uppercase text-black"
                  >
                    Inserir
                  </button>
                </div>
              </form>
            </section>

            {/* 4. BUSCA, FILTROS E LISTA DE INSCRITOS */}
            <section className="mt-6 border-4 border-white bg-[#141414] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-white/20 pb-4">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, telefone, @insta ou categoria..."
                  className="min-w-[240px] flex-1 border-2 border-white bg-black p-2 text-sm font-bold text-white"
                />
                <div className="flex flex-wrap gap-1.5">
                  {(['Todos', 'Pendente', 'Pago', 'Cancelado'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFiltroStatus(st)}
                      className={`cursor-pointer border-2 px-3 py-1.5 text-xs font-black uppercase ${
                        filtroStatus === st
                          ? 'border-white bg-[#ffe600] text-black'
                          : 'border-white/40 bg-black text-white/70 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {carregandoIngressos ? (
                <p className="py-8 text-center text-sm font-bold uppercase text-white/60">Carregando lista...</p>
              ) : ingressosFiltrados.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold uppercase text-white/50">
                  Nenhum registro encontrado nesse filtro.
                </p>
              ) : (
                <ul className="mt-4 divide-y-2 divide-white/10">
                  {ingressosFiltrados.map((ing) => (
                    <li key={ing.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-[200px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black uppercase">{ing.inscrito}</span>
                          <span className="border border-white/40 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white/80">
                            {ing.categoria ?? 'Antecipado'}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase text-black ${
                              ing.status === 'Pago'
                                ? 'bg-[#25d366]'
                                : ing.status === 'Pendente'
                                  ? 'bg-[#ffe600]'
                                  : 'bg-red-500 text-white'
                            }`}
                          >
                            {ing.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/60">
                          Contato: {ing.contato || '—'}
                          {ing.status === 'Cancelado' && (
                            <span className="ml-3 text-red-400">
                              • Estornado: {ing.estornado ? `Sim (${ing.data_estorno})` : 'Não'}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {ing.status !== 'Pago' && (
                          <button
                            onClick={() => confirmarPagamento(ing.id)}
                            className="cursor-pointer border-2 border-white bg-[#25d366] px-2.5 py-1 text-xs font-black uppercase text-black"
                          >
                            ✓ Confirmar Pix
                          </button>
                        )}
                        {ing.status !== 'Cancelado' && (
                          <button
                            onClick={() => cancelarIngresso(ing)}
                            className="cursor-pointer border-2 border-red-400 bg-black px-2.5 py-1 text-xs font-bold uppercase text-red-400 hover:bg-red-500 hover:text-black"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          onClick={() => editarNomeIngresso(ing)}
                          className="cursor-pointer border-2 border-white/40 px-2.5 py-1 text-xs font-bold uppercase text-white/80 hover:border-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => apagarIngresso(ing)}
                          className="cursor-pointer border-2 border-white/20 px-2 py-1 text-xs font-bold uppercase text-white/40 hover:border-red-500 hover:text-red-400"
                          title="Excluir registro"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* ================================================================= */}
      {/* 5. FOLHA DE IMPRESSÃO A4 (SÓ APARECE QUANDO APERTA IMPRIMIR)      */}
      {/* ================================================================= */}
      {eventoAtual && (
        <div className="hidden print:block print:p-6 print:text-black">
          <div className="border-b-2 border-black pb-3">
            <div className="flex items-baseline justify-between">
              <h1 className="text-2xl font-black uppercase tracking-wider">
                SELO PULSARS • LISTA DE PORTARIA
              </h1>
              <span className="text-xs font-bold uppercase">@selopulsars</span>
            </div>
            <p className="mt-1 text-lg font-extrabold uppercase">
              Evento: {eventoAtual.nome} | Data: {eventoAtual.data}{' '}
              {eventoAtual.horario ? `às ${eventoAtual.horario}` : ''}
            </p>
            {eventoAtual.bandas && (
              <p className="text-xs font-bold uppercase">Line-up: {eventoAtual.bandas}</p>
            )}
            <p className="mt-1 text-xs font-bold">
              Total de nomes confirmados na folha: {listaPortaria.length} (Ordem Alfabética A–Z)
            </p>
          </div>

          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black uppercase">
                <th className="w-10 py-1.5">Check</th>
                <th className="w-10 py-1.5">#</th>
                <th className="py-1.5">Nome Completo (A-Z)</th>
                <th className="py-1.5">Categoria</th>
                <th className="py-1.5">Contato / Obs</th>
              </tr>
            </thead>
            <tbody>
              {listaPortaria.map((pessoa, idx) => (
                <tr key={pessoa.id} className="border-b border-black/30">
                  <td className="py-1.5 font-mono text-base">[ &nbsp; ]</td>
                  <td className="py-1.5 font-bold">{idx + 1}</td>
                  <td className="py-1.5 font-bold uppercase">{pessoa.inscrito}</td>
                  <td className="py-1.5 text-xs uppercase">{pessoa.categoria ?? 'Antecipado'}</td>
                  <td className="py-1.5 text-xs">{pessoa.contato ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPage