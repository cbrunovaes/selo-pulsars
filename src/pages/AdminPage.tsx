import type { Session } from "@supabase/supabase-js";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../services/supabaseClient";
import { listarBandas } from "../utils/eventos";

type EventoAdmin = {
	id: number;
	nome: string;
	data: string;
	horario: string | null;
	bandas: string | null;
	flyer?: string | null;
	descricao?: string | null; // Novo campo integrado!
};

type Ingresso = {
	id: number;
	evento_id: number;
	inscrito: string;
	contato: string | null;
	status: string; // 'Pendente' | 'Pago' | 'Cancelado'
	categoria: string | null;
	estornado: boolean | null;
	data_estorno: string | null;
};

function AdminPage() {
	// --- AUTENTICAÇÃO ---
	const [sessao, setSessao] = useState<Session | null>(null);
	const [carregandoAuth, setCarregandoAuth] = useState(true);
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [erroLogin, setErroLogin] = useState("");

	// --- EVENTOS (CRUD) ---
	const [eventos, setEventos] = useState<EventoAdmin[]>([]);
	const [eventoSelecionadoId, setEventoSelecionadoId] = useState<number | null>(
		null,
	);
	const [modoFormEvento, setModoFormEvento] = useState<
		"fechado" | "criar" | "editar"
	>("fechado");
	const [evNome, setEvNome] = useState("");
	const [evData, setEvData] = useState("");
	const [evHorario, setEvHorario] = useState("");
	const [evBandas, setEvBandas] = useState("");
	const [evFlyer, setEvFlyer] = useState("");
	const [evDescricao, setEvDescricao] = useState(""); // Estado da Descrição
	const [salvandoEvento, setSalvandoEvento] = useState(false);

	// --- INGRESSOS ---
	const [ingressos, setIngressos] = useState<Ingresso[]>([]);
	const [carregandoIngressos, setCarregandoIngressos] = useState(false);
	const [busca, setBusca] = useState("");
	const [filtroStatus, setFiltroStatus] = useState<
		"Todos" | "Pendente" | "Pago" | "Cancelado"
	>("Todos");

	// --- ADICIONAR VIP / STAFF / MANUAL ---
	const [novoNome, setNovoNome] = useState("");
	const [novoContato, setNovoContato] = useState("");
	const [novaCategoria, setNovaCategoria] = useState("");
	const [novoStatus, setNovoStatus] = useState<"Pago" | "Pendente">("Pago");

	const eventoAtual = eventos.find((e) => e.id === eventoSelecionadoId) ?? null;
	const bandasDoEvento = listarBandas(eventoAtual?.bandas ?? null);

	// --- CARREGAMENTO (estáveis via useCallback para os efeitos) ---
	const carregarEventos = useCallback(async () => {
		const { data, error } = await supabase
			.from("eventos")
			.select("*")
			.order("id", { ascending: false });

		if (error) {
			alert(`Erro ao carregar eventos: ${error.message}`);
			return;
		}

		const lista = (data ?? []) as EventoAdmin[];
		setEventos(lista);
		setEventoSelecionadoId((atual) => {
			if (lista.length === 0) return null;
			return atual ?? lista[0].id;
		});
	}, []);

	const carregarIngressos = useCallback(async (idEvento: number) => {
		setCarregandoIngressos(true);
		const { data, error } = await supabase
			.from("ingressos")
			.select("*")
			.eq("evento_id", idEvento);

		if (error) {
			alert(`Erro ao carregar ingressos: ${error.message}`);
		} else {
			setIngressos((data ?? []) as Ingresso[]);
		}
		setCarregandoIngressos(false);
	}, []);

	// 1. Checar sessão de login
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSessao(data.session);
			setCarregandoAuth(false);
		});

		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setSessao(session);
			},
		);

		return () => listener.subscription.unsubscribe();
	}, []);

	// 2. Carregar eventos ao logar
	useEffect(() => {
		if (sessao) {
			carregarEventos();
		}
	}, [sessao, carregarEventos]);

	// 3. Carregar ingressos quando trocar de evento
	useEffect(() => {
		if (eventoSelecionadoId) {
			carregarIngressos(eventoSelecionadoId);
		} else {
			setIngressos([]);
		}
	}, [eventoSelecionadoId, carregarIngressos]);

	async function fazerLogin(e: FormEvent) {
		e.preventDefault();
		setErroLogin("");
		const { error } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password: senha,
		});
		if (error) {
			setErroLogin("E-mail ou senha incorretos.");
		}
	}

	async function sair() {
		await supabase.auth.signOut();
	}

	// --- FUNÇÕES DE EVENTOS ---
	function abrirCriarEvento() {
		setEvNome("");
		setEvData("");
		setEvHorario("");
		setEvBandas("");
		setEvFlyer("");
		setEvDescricao(""); // Limpa a descrição ao criar
		setModoFormEvento("criar");
	}

	function abrirEditarEvento() {
		if (!eventoAtual) return;
		setEvNome(eventoAtual.nome ?? "");
		setEvData(eventoAtual.data ?? "");
		setEvHorario(eventoAtual.horario ?? "");
		setEvBandas(eventoAtual.bandas ?? "");
		setEvFlyer(eventoAtual.flyer ?? "");
		setEvDescricao(eventoAtual.descricao ?? ""); // Puxa a descrição do banco
		setModoFormEvento("editar");
	}

	async function salvarEvento(e: FormEvent) {
		e.preventDefault();
		if (!evNome.trim() || !evData.trim()) {
			alert("Preencha pelo menos o Nome e a Data do evento.");
			return;
		}

		setSalvandoEvento(true);
		const payload = {
			nome: evNome.trim(),
			data: evData.trim(),
			horario: evHorario.trim() || null,
			bandas: evBandas.trim() || null,
			flyer: evFlyer.trim() || null,
			descricao: evDescricao.trim() || null, // Salva no banco
		};

		if (modoFormEvento === "criar") {
			const { data, error } = await supabase
				.from("eventos")
				.insert(payload)
				.select()
				.single();
			setSalvandoEvento(false);
			if (error) {
				alert(`Erro ao criar evento: ${error.message}`);
				return;
			}
			setModoFormEvento("fechado");
			await carregarEventos();
			if (data) setEventoSelecionadoId(data.id);
		} else if (modoFormEvento === "editar" && eventoAtual) {
			const { error } = await supabase
				.from("eventos")
				.update(payload)
				.eq("id", eventoAtual.id);
			setSalvandoEvento(false);
			if (error) {
				alert(`Erro ao atualizar evento: ${error.message}`);
				return;
			}
			setModoFormEvento("fechado");
			await carregarEventos();
		}
	}

	async function apagarEventoAtual() {
		if (!eventoAtual) return;
		const confirmar = window.confirm(
			`ATENÇÃO: Tem certeza que deseja APAGAR o evento "${eventoAtual.nome}" e TODOS os ingressos vinculados a ele? Essa ação não tem volta.`,
		);
		if (!confirmar) return;

		await supabase.from("ingressos").delete().eq("evento_id", eventoAtual.id);
		const { error } = await supabase
			.from("eventos")
			.delete()
			.eq("id", eventoAtual.id);

		if (error) {
			alert(`Erro ao apagar evento: ${error.message}`);
			return;
		}

		setEventoSelecionadoId(null);
		await carregarEventos();
	}

	// --- FUNÇÕES DE INGRESSOS ---
	async function adicionarPessoaManual(e: FormEvent) {
		e.preventDefault();
		if (!eventoSelecionadoId || !novoNome.trim() || !novaCategoria) {
			alert("Preencha o nome e selecione uma categoria, caraio")
		 return;
		};

		const { error } = await supabase.from("ingressos").insert({
			evento_id: eventoSelecionadoId,
			inscrito: novoNome.trim(),
			contato: novoContato.trim() || "Lista Interna",
			categoria: novaCategoria,
			status: novoStatus,
			estornado: false,
		});

		if (error) {
			alert(`Erro ao adicionar nome: ${error.message}`);
			return;
		}

		setNovoNome("");
		setNovoContato("");
		carregarIngressos(eventoSelecionadoId);
		setNovaCategoria("");
	}

	async function confirmarPagamento(idIngresso: number) {
		if (!eventoSelecionadoId) return;
		const { error } = await supabase
			.from("ingressos")
			.update({ status: "Pago", estornado: false, data_estorno: null })
			.eq("id", idIngresso);

		if (error) alert(`Erro ao confirmar: ${error.message}`);
		else carregarIngressos(eventoSelecionadoId);
	}

	async function cancelarIngresso(ingresso: Ingresso) {
		if (!eventoSelecionadoId) return;
		const foiEstornado = window.confirm(
			`Cancelar o ingresso de "${ingresso.inscrito}".\n\nClique em OK se houve ESTORNO do Pix (Estornado = true), ou Cancelar se apenas desistiu sem estorno.`,
		);
		const hoje = new Date().toLocaleDateString("pt-BR");

		const { error } = await supabase
			.from("ingressos")
			.update({
				status: "Cancelado",
				estornado: foiEstornado,
				data_estorno: foiEstornado ? hoje : null,
			})
			.eq("id", ingresso.id);

		if (error) alert(`Erro ao cancelar: ${error.message}`);
		else carregarIngressos(eventoSelecionadoId);
	}

	async function editarNomeIngresso(ingresso: Ingresso) {
		if (!eventoSelecionadoId) return;
		const novoTexto = window.prompt(
			"Editar nome do inscrito:",
			ingresso.inscrito,
		);
		if (!novoTexto?.trim()) return;

		const { error } = await supabase
			.from("ingressos")
			.update({ inscrito: novoTexto.trim() })
			.eq("id", ingresso.id);

		if (error) alert(`Erro ao editar: ${error.message}`);
		else carregarIngressos(eventoSelecionadoId);
	}

	async function apagarIngresso(ingresso: Ingresso) {
		if (!eventoSelecionadoId) return;
		if (
			!window.confirm(`Apagar permanentemente "${ingresso.inscrito}" da lista?`)
		)
			return;

		const { error } = await supabase
			.from("ingressos")
			.delete()
			.eq("id", ingresso.id);
		if (error) alert(`Erro ao apagar: ${error.message}`);
		else carregarIngressos(eventoSelecionadoId);
	}

	// --- ORDENAÇÃO ALFABÉTICA E FILTROS ---
	const ingressosOrdenados = [...ingressos].sort((a, b) =>
		(a.inscrito ?? "").localeCompare(b.inscrito ?? "", "pt-BR", {
			sensitivity: "base",
		}),
	);

	const ingressosFiltrados = ingressosOrdenados.filter((ing) => {
		const bateStatus = filtroStatus === "Todos" || ing.status === filtroStatus;
		const termo = busca.trim().toLowerCase();
		const bateBusca =
			!termo ||
			ing.inscrito?.toLowerCase().includes(termo) ||
			ing.contato?.toLowerCase().includes(termo) ||
			ing.categoria?.toLowerCase().includes(termo);
		return bateStatus && bateBusca;
	});

	const listaPortaria = ingressosOrdenados.filter((i) => i.status === "Pago");

	const totalPagos = ingressos.filter(
		(i) => i.status === "Pago" && i.categoria === "Antecipado",
	).length;
	const totalVipStaff = ingressos.filter(
		(i) => i.status === "Pago" && i.categoria !== "Antecipado",
	).length;
	const totalPendentes = ingressos.filter(
		(i) => i.status === "Pendente",
	).length;
	const totalCancelados = ingressos.filter(
		(i) => i.status === "Cancelado",
	).length;

	if (carregandoAuth) {
		return (
			<div className="min-h-screen bg-[#09070c] p-10 text-center font-bold text-[#c77dff] font-orbitron">
				Carregando Sistema...
			</div>
		);
	}

	// ==========================================
	// TELA DE LOGIN 
	// ==========================================
	if (!sessao) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#09070c] px-4 text-[#e8dff5] selection:bg-[#c77dff] selection:text-[#09070c]">
				<div className="w-full max-w-md border-4 border-[#1e162b] bg-[#15101f] p-6 shadow-[8px_8px_0_#c77dff]">
					<h1 className="font-orbitron text-3xl font-black uppercase text-[#d45d8a] drop-shadow-[2px_2px_0_#1e162b]">
						QG Selo Pulsars
					</h1>
					<p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#e8dff5]/60">
						Acesso restrito da organização
					</p>

					<form onSubmit={fazerLogin} className="mt-6 space-y-5">
						<div>
							<label
								htmlFor="login-email"
								className="text-xs font-black uppercase tracking-widest text-[#c77dff]"
							>
								E-mail
							</label>
							<input
								id="login-email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="mt-1 w-full border-4 border-[#1e162b] bg-[#09070c] p-3 font-bold text-[#e8dff5] focus:border-[#c77dff] focus:outline-none transition-colors"
							/>
						</div>
						<div>
							<label
								htmlFor="login-senha"
								className="text-xs font-black uppercase tracking-widest text-[#c77dff]"
							>
								Senha
							</label>
							<input
								id="login-senha"
								type="password"
								required
								value={senha}
								onChange={(e) => setSenha(e.target.value)}
								className="mt-1 w-full border-4 border-[#1e162b] bg-[#09070c] p-3 font-bold text-[#e8dff5] focus:border-[#c77dff] focus:outline-none transition-colors"
							/>
						</div>

						{erroLogin && (
							<p className="border-4 border-[#d45d8a] bg-[#d45d8a]/10 p-3 text-sm font-bold text-[#d45d8a]">
								{erroLogin}
							</p>
						)}

						<button
							type="submit"
							className="w-full cursor-pointer border-4 border-[#1e162b] bg-[#c77dff] py-4 font-orbitron font-black uppercase tracking-[0.2em] text-[#09070c] shadow-[4px_4px_0_#1e162b] transition-all hover:-translate-y-1 hover:bg-[#d45d8a] hover:shadow-[6px_6px_0_#1e162b] active:translate-y-0"
						>
							Entrar no Painel
						</button>
					</form>

					<Link
						to="/"
						className="mt-8 block text-center text-xs font-bold uppercase text-[#e8dff5]/50 hover:text-[#c77dff] transition-colors"
					>
						← Voltar para a página pública
					</Link>
				</div>
			</div>
		);
	}

	const inputClasse = "mt-1 w-full border-2 border-[#1e162b] bg-[#09070c] p-2 text-sm font-bold text-[#e8dff5] focus:border-[#c77dff] focus:outline-none transition-colors";

	// ==========================================
	// PAINEL ADMIN + FOLHA DE IMPRESSÃO
	// ==========================================
	return (
		<div className="min-h-screen bg-[#09070c] text-[#e8dff5] selection:bg-[#c77dff] selection:text-[#09070c] print:bg-white print:text-black">
			<div className="mx-auto max-w-5xl px-4 py-8 print:hidden">
				
				{/* Topo Admin */}
				<header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#1e162b] pb-6">
					<div>
						<h1 className="font-orbitron text-3xl font-black uppercase text-[#d45d8a] drop-shadow-[2px_2px_0_#1e162b]">
							Painel Admin • Pulsars
						</h1>
						<p className="text-xs font-bold uppercase tracking-widest text-[#e8dff5]/60 mt-1">
							Controle de Eventos, Pix e Lista da Portaria
						</p>
					</div>
					<div className="flex gap-3">
						<Link
							to="/"
							className="border-2 border-[#1e162b] bg-[#15101f] px-4 py-2 text-xs font-black uppercase hover:bg-[#c77dff] hover:text-[#09070c] transition-colors"
						>
							Ver Site
						</Link>
						<button
							type="button"
							onClick={sair}
							className="cursor-pointer border-2 border-[#d45d8a] bg-[#09070c] px-4 py-2 text-xs font-black uppercase text-[#d45d8a] hover:bg-[#d45d8a] hover:text-[#09070c] transition-colors"
						>
							Sair
						</button>
					</div>
				</header>

				{/* 1. CONTROLE DE EVENTOS */}
				<section className="mt-8 border-4 border-[#1e162b] bg-[#15101f] p-5 shadow-[6px_6px_0_#c77dff]">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="min-w-60 flex-1">
							<label
								htmlFor="evento-selecionado"
								className="font-orbitron text-xs font-black uppercase tracking-widest text-[#c77dff]"
							>
								Evento Selecionado
							</label>
							<select
								id="evento-selecionado"
								value={eventoSelecionadoId ?? ""}
								onChange={(e) => setEventoSelecionadoId(Number(e.target.value))}
								className="mt-2 w-full border-4 border-[#1e162b] bg-[#09070c] p-3 text-base font-black uppercase text-[#e8dff5] focus:outline-none focus:border-[#c77dff]"
							>
								{eventos.length === 0 && (
									<option value="">Nenhum evento cadastrado</option>
								)}
								{eventos.map((ev) => (
									<option key={ev.id} value={ev.id}>
										#{ev.id} - {ev.nome} ({ev.data})
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={abrirCriarEvento}
								className="cursor-pointer border-2 border-[#1e162b] bg-[#c77dff] px-4 py-3 text-xs font-black uppercase text-[#09070c] hover:bg-[#d45d8a] transition-colors"
							>
								+ Novo Evento
							</button>
							{eventoAtual && (
								<>
									<button
										type="button"
										onClick={abrirEditarEvento}
										className="cursor-pointer border-2 border-[#1e162b] bg-[#e8dff5] px-4 py-3 text-xs font-black uppercase text-[#09070c] hover:bg-[#c77dff] transition-colors"
									>
										Editar Evento
									</button>
									<button
										type="button"
										onClick={apagarEventoAtual}
										className="cursor-pointer border-2 border-[#d45d8a] bg-[#09070c] px-4 py-3 text-xs font-black uppercase text-[#d45d8a] hover:bg-[#d45d8a] hover:text-[#09070c] transition-colors"
									>
										Apagar
									</button>
								</>
							)}
						</div>
					</div>

					{/* Formulário de Criar / Editar Evento */}
					{modoFormEvento !== "fechado" && (
						<form
							onSubmit={salvarEvento}
							className="mt-8 border-t-4 border-dashed border-[#1e162b] pt-6"
						>
							<h3 className="font-orbitron text-sm font-black uppercase tracking-widest text-[#d45d8a]">
								{modoFormEvento === "criar"
									? "Cadastrar Novo Evento"
									: `Editando: ${eventoAtual?.nome}`}
							</h3>
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<div>
									<label htmlFor="ev-nome" className="text-xs font-bold uppercase text-[#c77dff]">
										Nome do Rolê *
									</label>
									<input
										id="ev-nome"
										required
										value={evNome}
										onChange={(e) => setEvNome(e.target.value)}
										placeholder="Ex: Ovo Frito #4"
										className={inputClasse}
									/>
								</div>
								<div>
									<label htmlFor="ev-data" className="text-xs font-bold uppercase text-[#c77dff]">
										Data (DD/MM/AAAA) *
									</label>
									<input
										id="ev-data"
										required
										value={evData}
										onChange={(e) => setEvData(e.target.value)}
										placeholder="Ex: 24/10/2026"
										className={inputClasse}
									/>
								</div>
								<div>
									<label htmlFor="ev-horario" className="text-xs font-bold uppercase text-[#c77dff]">
										Horário
									</label>
									<input
										id="ev-horario"
										value={evHorario}
										onChange={(e) => setEvHorario(e.target.value)}
										placeholder="Ex: 22h"
										className={inputClasse}
									/>
								</div>
								<div>
									<label htmlFor="ev-flyer" className="text-xs font-bold uppercase text-[#c77dff]">
										Link do Flyer (URL)
									</label>
									<input
										id="ev-flyer"
										value={evFlyer}
										onChange={(e) => setEvFlyer(e.target.value)}
										placeholder="https://..."
										className={inputClasse}
									/>
								</div>
								<div className="sm:col-span-2">
									<label htmlFor="ev-bandas" className="text-xs font-bold uppercase text-[#c77dff]">
										Bandas (separadas por vírgula)
									</label>
									<input
										id="ev-bandas"
										value={evBandas}
										onChange={(e) => setEvBandas(e.target.value)}
										placeholder="Ex: Bardum, Cursed Cult, Analistas de Vênus"
										className={inputClasse}
									/>
								</div>
								{/* NOVO CAMPO: DESCRIÇÃO */}
								<div className="sm:col-span-2">
									<label htmlFor="ev-descricao" className="text-xs font-bold uppercase text-[#c77dff]">
										Descrição / Sobre o Rolê
									</label>
									<textarea
										id="ev-descricao"
										rows={4}
										value={evDescricao}
										onChange={(e) => setEvDescricao(e.target.value)}
										placeholder="Descreva o evento, competições, informações extras..."
										className="mt-1 w-full border-2 border-[#1e162b] bg-[#09070c] p-3 text-sm font-bold text-[#e8dff5] focus:border-[#c77dff] focus:outline-none transition-colors"
									/>
								</div>
							</div>
							<div className="mt-6 flex gap-3">
								<button
									type="submit"
									disabled={salvandoEvento}
									className="cursor-pointer border-2 border-[#1e162b] bg-[#c77dff] px-6 py-2 text-xs font-black uppercase text-[#09070c] hover:bg-[#d45d8a] transition-colors"
								>
									{salvandoEvento ? "Salvando..." : "Salvar Evento"}
								</button>
								<button
									type="button"
									onClick={() => setModoFormEvento("fechado")}
									className="cursor-pointer border-2 border-[#1e162b] bg-transparent px-6 py-2 text-xs font-black uppercase text-[#e8dff5]/70 hover:text-[#e8dff5] transition-colors"
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
						<section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
							<div className="border-4 border-[#1e162b] bg-[#15101f] p-4 text-center shadow-[4px_4px_0_#25d366]">
								<span className="font-orbitron block text-3xl font-black text-[#25d366]">
									{totalPagos}
								</span>
								<span className="text-[10px] font-bold uppercase tracking-widest text-[#e8dff5]/70">
									Antecipados Pagos
								</span>
							</div>
							<div className="border-4 border-[#1e162b] bg-[#15101f] p-4 text-center shadow-[4px_4px_0_#c77dff]">
								<span className="font-orbitron block text-3xl font-black text-[#c77dff]">
									{totalPendentes}
								</span>
								<span className="text-[10px] font-bold uppercase tracking-widest text-[#e8dff5]/70">
									Pendentes (Pix)
								</span>
							</div>
							<div className="border-4 border-[#1e162b] bg-[#15101f] p-4 text-center shadow-[4px_4px_0_#38bdf8]">
								<span className="font-orbitron block text-3xl font-black text-[#38bdf8]">
									{totalVipStaff}
								</span>
								<span className="text-[10px] font-bold uppercase tracking-widest text-[#e8dff5]/70">
									VIP / Staff
								</span>
							</div>
							<div className="border-4 border-[#1e162b] bg-[#15101f] p-4 text-center shadow-[4px_4px_0_#d45d8a]">
								<span className="font-orbitron block text-3xl font-black text-[#d45d8a]">
									{totalCancelados}
								</span>
								<span className="text-[10px] font-bold uppercase tracking-widest text-[#e8dff5]/70">
									Cancelados
								</span>
							</div>
							<button
								type="button"
								onClick={() => window.print()}
								className="col-span-2 cursor-pointer border-4 border-[#1e162b] bg-[#e8dff5] p-4 text-center font-orbitron text-sm font-black uppercase tracking-widest text-[#09070c] shadow-[4px_4px_0_#1e162b] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#1e162b] sm:col-span-1"
							>
								🖨️ Imprimir Lista ({listaPortaria.length})
							</button>
						</section>

						{/* 3. CADASTRO MANUAL */}
						<section className="mt-8 border-4 border-[#1e162b] bg-[#15101f] p-5 shadow-[6px_6px_0_#1e162b]">
							<h2 className="font-orbitron text-xs font-black uppercase tracking-widest text-[#c77dff]">
								+ Adicionar Manualmente (VIP, Staff ou Porta)
							</h2>
							<form
								onSubmit={adicionarPessoaManual}
								className="mt-4 grid gap-3 sm:grid-cols-5"
							>
								<input
									required
									value={novoNome}
									onChange={(e) => setNovoNome(e.target.value)}
									placeholder="Nome completo..."
									className="border-2 border-[#1e162b] bg-[#09070c] p-3 text-sm font-bold text-[#e8dff5] focus:outline-none focus:border-[#c77dff] sm:col-span-2"
								/>
								<input
									value={novoContato}
									onChange={(e) => setNovoContato(e.target.value)}
									placeholder="Tel / @insta / Obs..."
									className="border-2 border-[#1e162b] bg-[#09070c] p-3 text-sm font-bold text-[#e8dff5] focus:outline-none focus:border-[#c77dff]"
								/>
								<select
									value={novaCategoria}
									onChange={(e) => setNovaCategoria(e.target.value)}
									className="border-2 border-[#1e162b] bg-[#09070c] p-3 text-sm font-bold text-[#e8dff5] focus:outline-none focus:border-[#c77dff]"
								>	<option value="" disabled> Selecione a categoria </option>
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
										onChange={(e) =>
											setNovoStatus(e.target.value as "Pago" | "Pendente")
										}
										className="w-full border-2 border-[#1e162b] bg-[#09070c] p-3 text-xs font-bold text-[#e8dff5] focus:outline-none focus:border-[#c77dff]"
									>
										<option value="Pago">Confirmado</option>
										<option value="Pendente">Pendente</option>
									</select>
									<button
										type="submit"
										className="cursor-pointer border-2 border-[#1e162b] bg-[#d45d8a] px-4 py-3 text-xs font-black uppercase text-[#09070c] hover:bg-[#c77dff] transition-colors"
									>
										Inserir
									</button>
								</div>
							</form>
						</section>

						{/* 4. BUSCA E LISTA DE INSCRITOS */}
						<section className="mt-8 border-4 border-[#1e162b] bg-[#15101f] p-5 shadow-[6px_6px_0_#1e162b]">
							<div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-[#1e162b] pb-5">
								<input
									type="text"
									value={busca}
									onChange={(e) => setBusca(e.target.value)}
									placeholder="Buscar nome, @insta, categoria..."
									className="min-w-60 flex-1 border-2 border-[#1e162b] bg-[#09070c] p-3 text-sm font-bold text-[#e8dff5] focus:outline-none focus:border-[#c77dff]"
								/>
								<div className="flex flex-wrap gap-2">
									{(["Todos", "Pendente", "Pago", "Cancelado"] as const).map(
										(st) => (
											<button
												type="button"
												key={st}
												onClick={() => setFiltroStatus(st)}
												className={`cursor-pointer border-2 px-4 py-2 text-xs font-black uppercase transition-colors ${
													filtroStatus === st
														? "border-[#1e162b] bg-[#c77dff] text-[#09070c]"
														: "border-[#1e162b] bg-[#09070c] text-[#e8dff5]/60 hover:text-[#e8dff5]"
												}`}
											>
												{st}
											</button>
										),
									)}
								</div>
							</div>

							{carregandoIngressos ? (
								<p className="py-10 text-center font-orbitron text-sm font-bold uppercase tracking-widest text-[#e8dff5]/60">
									Carregando lista...
								</p>
							) : ingressosFiltrados.length === 0 ? (
								<p className="py-10 text-center font-orbitron text-sm font-bold uppercase tracking-widest text-[#e8dff5]/40">
									Nenhum registro encontrado.
								</p>
							) : (
								<ul className="mt-2 divide-y-2 divide-[#1e162b]">
									{ingressosFiltrados.map((ing) => (
										<li
											key={ing.id}
											className="flex flex-wrap items-center justify-between gap-4 py-4"
										>
											<div className="min-w-50 flex-1">
												<div className="flex flex-wrap items-center gap-3">
													<span className="text-lg font-black uppercase text-[#e8dff5]">
														{ing.inscrito}
													</span>
													<span className="border-2 border-[#1e162b] bg-[#09070c] px-2 py-1 text-[10px] font-bold uppercase text-[#e8dff5]/80">
														{ing.categoria ?? "Antecipado"}
													</span>
													<span
														className={`border-2 border-[#1e162b] px-2 py-1 text-[10px] font-black uppercase text-[#09070c] ${
															ing.status === "Pago"
																? "bg-[#25d366]"
																: ing.status === "Pendente"
																	? "bg-[#c77dff]"
																	: "bg-[#d45d8a] text-[#09070c]"
														}`}
													>
														{ing.status}
													</span>
												</div>
												<p className="mt-2 text-xs font-bold text-[#e8dff5]/50 uppercase tracking-wider">
													Contato: <span className="text-[#e8dff5]/80">{ing.contato || "—"}</span>
													{ing.status === "Cancelado" && (
														<span className="ml-4 text-[#d45d8a]">
															• Estornado:{" "}
															{ing.estornado
																? `Sim (${ing.data_estorno})`
																: "Não"}
														</span>
													)}
												</p>
											</div>

											<div className="flex flex-wrap gap-2">
												{ing.status !== "Pago" && (
													<button
														type="button"
														onClick={() => confirmarPagamento(ing.id)}
														className="cursor-pointer border-2 border-[#1e162b] bg-[#25d366] px-3 py-2 text-xs font-black uppercase text-[#09070c] hover:bg-white transition-colors"
													>
														✓ Confirmar Pix
													</button>
												)}
												{ing.status !== "Cancelado" && (
													<button
														type="button"
														onClick={() => cancelarIngresso(ing)}
														className="cursor-pointer border-2 border-[#d45d8a] bg-[#09070c] px-3 py-2 text-xs font-bold uppercase text-[#d45d8a] hover:bg-[#d45d8a] hover:text-[#09070c] transition-colors"
													>
														Cancelar
													</button>
												)}
												<button
													type="button"
													onClick={() => editarNomeIngresso(ing)}
													className="cursor-pointer border-2 border-[#1e162b] bg-[#09070c] px-3 py-2 text-xs font-bold uppercase text-[#e8dff5]/80 hover:bg-[#1e162b] hover:text-[#e8dff5] transition-colors"
												>
													Editar
												</button>
												<button
													type="button"
													onClick={() => apagarIngresso(ing)}
													className="cursor-pointer border-2 border-[#1e162b] bg-[#09070c] px-3 py-2 text-xs font-bold uppercase text-[#e8dff5]/30 hover:border-[#d45d8a] hover:text-[#d45d8a] transition-colors"
													title="Excluir permanentemente"
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
			{/* 5. FOLHA DE IMPRESSÃO A4 (Compacta, com Logo e Box de Check)      */}
			{/* ================================================================= */}
			{eventoAtual && (
				<div className="hidden print:block print:p-4 print:text-black print:bg-white font-mono">
					
					{/* Cabeçalho */}
					<div className="border-b-2 border-black pb-3 flex justify-between items-center">
						<div className="flex-1">
							<h1 className="font-orbitron text-2xl font-black uppercase tracking-widest">
								PULSARS • LISTA DE PORTARIA
							</h1>
							<p className="mt-1 text-base font-extrabold uppercase">
								Evento: {eventoAtual.nome}
							</p>
							<p className="text-xs font-bold uppercase mt-1">
								Data: {eventoAtual.data} {eventoAtual.horario ? `às ${eventoAtual.horario}` : ""}
							</p>
							{eventoAtual.bandas && (
								<p className="text-[10px] font-bold uppercase mt-1">
									Line-up: {eventoAtual.bandas}
								</p>
							)}
							<p className="mt-2 text-[10px] font-bold bg-black text-white inline-block px-2 py-1 uppercase">
								Total Confirmados: {listaPortaria.length} (Ordem Alfabética A–Z)
							</p>
						</div>
						
						{/* Logo no Canto Direito */}
						<div className="shrink-0 flex flex-col items-end justify-center ml-4">
							<img 
								src="/logo.png" 
								alt="Selo Pulsars" 
								className="w-20 h-auto grayscale" 
							/>
							<span className="text-[10px] font-bold uppercase mt-1">@selopulsars</span>
						</div>
					</div>

					{/* Tabela de Nomes */}
					<table className="mt-4 w-full border-collapse text-left text-xs">
						<thead>
							<tr className="border-b-2 border-black uppercase">
								<th className="w-10 py-1.5 text-center">OK</th>
								<th className="w-8 py-1.5">#</th>
								<th className="py-1.5">Nome Completo (A-Z)</th>
								<th className="py-1.5 w-1/4">Categoria</th>
								<th className="py-1.5 w-1/4">Contato / Obs</th>
							</tr>
						</thead>
						<tbody>
							{listaPortaria.map((pessoa, idx) => (
								<tr key={pessoa.id} className="border-b border-black/20">
									<td className="py-1.5">
										{/* Quadrado limpo pra marcar com caneta */}
										<div className="w-4 h-4 border-2 border-black mx-auto"></div>
									</td>
									<td className="py-1.5 font-bold text-gray-500">{idx + 1}</td>
									<td className="py-1.5 font-bold uppercase text-sm">
										{pessoa.inscrito}
									</td>
									<td className="py-1.5 text-[10px] uppercase font-bold text-gray-600">
										{pessoa.categoria ?? "Antecipado"}
									</td>
									<td className="py-1.5 text-[10px] text-gray-600">
										{pessoa.contato ?? ""}
									</td>
								</tr>
							))}
							{/* Linhas em branco para vendas na porta ou VIP de última hora */}
							{[...Array(30)].map((_, i) => (
								<tr key={`vazio-${i}`} className="border-b border-black/20">
									<td className="py-2">
										<div className="w-4 h-4 border-2 border-black mx-auto"></div>
									</td>
									<td className="py-2 font-bold text-gray-400">-</td>
									<td className="py-2 border-b border-dashed border-gray-300"></td>
									<td className="py-2 border-b border-dashed border-gray-300"></td>
									<td className="py-2 border-b border-dashed border-gray-300"></td>
								</tr>
							))}
						</tbody>
					</table>
					
					<div className="mt-8 text-center text-[9px] uppercase font-bold text-gray-400">
						Documento gerado pelo sistema de Ingressos Pulsars
					</div>
				</div>
			)}
		</div>
	);
}

export default AdminPage;