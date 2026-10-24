import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { supabase } from "../services/supabaseClient";
import {
	type Evento,
	formatarData,
	listarBandas,
	parseData,
} from "../utils/eventos";

const MEU_WHATSAPP = "5513981002799";
const MINHA_CHAVE_PIX = "selopulsars@gmail.com";
const STATUS_INICIAL = "Pendente";

function mascararTelefone(valor: string) {
	const d = valor.replace(/\D/g, "").slice(0, 11);
	if (d.length <= 2) return d;
	if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
	if (d.length <= 10)
		return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
	return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Event() {
	const { id } = useParams();
	const eventoId = Number(id);

	const [evento, setEvento] = useState<Evento | null>(null);
	const [carregando, setCarregando] = useState(true);
	const [erroCarregar, setErroCarregar] = useState("");
	const [flyerQuebrado, setFlyerQuebrado] = useState(false);
	const [modalFlyerAberto, setModalFlyerAberto] = useState(false);

	const [nome, setNome] = useState("");
	const [telefone, setTelefone] = useState("");
	const [instagram, setInstagram] = useState("");
	const [salvando, setSalvando] = useState(false);
	const [erroForm, setErroForm] = useState("");
	const [ingressoCriado, setIngressoCriado] = useState(false);

	useEffect(() => {
		if (!Number.isInteger(eventoId)) {
			setCarregando(false);
			return;
		}

		let cancelado = false;

		async function carregarEvento() {
			setCarregando(true);
			setErroCarregar("");
			setFlyerQuebrado(false);

			const { data, error } = await supabase
				.from("eventos")
				.select("*")
				.eq("id", eventoId)
				.maybeSingle();

			if (cancelado) return;

			if (error) {
				console.error("Erro ao buscar evento:", error);
				setErroCarregar("Não deu pra carregar o evento. Tenta de novo.");
			} else {
				setEvento(data as Evento | null);
			}
			setCarregando(false);
		}

		carregarEvento();
		return () => {
			cancelado = true;
		};
	}, [eventoId]);

	async function enviarInscricao(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!evento) return;

		const nomeLimpo = nome.trim();
		const digitos = telefone.replace(/\D/g, "");

		if (nomeLimpo.length < 3) {
			setErroForm("Coloca seu nome completo.");
			return;
		}
		
		if (digitos.length > 0 && digitos.length < 10) {
			setErroForm("Telefone incompleto. Use DDD + número.");
			return;
		}

		setSalvando(true);
		setErroForm("");
		const instaLimpo = instagram.trim().replace(/^@+/, "");
		
		let contatoFinal = "Não informado";
		if (telefone && instaLimpo) contatoFinal = `${telefone} | @${instaLimpo}`;
		else if (telefone) contatoFinal = telefone;
		else if (instaLimpo) contatoFinal = `@${instaLimpo}`;

		const { error } = await supabase.from("ingressos").insert({
			evento_id: evento.id,
			inscrito: nomeLimpo,
			contato: contatoFinal,
			status: STATUS_INICIAL,
			categoria: "Antecipado",
		});

		if (error) {
			console.error("Erro ao salvar ingresso:", error);
			setErroForm(`Erro ao salvar pedido: ${error.message}`);
			setSalvando(false);
			return;
		}

		setIngressoCriado(true);
		setSalvando(false);
	}
	const instaFormatado = instagram.trim()
		? `@${instagram.trim().replace(/^@+/, "")}`
		: "Não informado";
	
	const telFormatado = telefone.trim() || "Não informado";

	const linkWhatsApp = evento
		? `https://wa.me/${MEU_WHATSAPP}?text=${encodeURIComponent(
				`Salve! Me inscrevi na lista do evento *${evento.nome}*.\n\n` +
					`*Nome:* ${nome.trim()}\n` +
					`*Telefone:* ${telFormatado}\n` +
					`*Instagram:* ${instaFormatado}\n\n` +
					`Vou realizar o Pix na chave:* ${MINHA_CHAVE_PIX} * e enviar o comprovante aqui para confirmar meu ingresso!`,
			)}`
		: "#";

	const { dia, mes, ano } = formatarData(evento?.data ?? null);
	const dataCompleta = parseData(evento?.data ?? null)?.toLocaleDateString(
		"pt-BR",
		{
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	);
	const bandas = listarBandas(evento?.bandas ?? null);

	const inputClasse =
		"mt-1 w-full border-4 border-[#1e162b] bg-[#09070c] px-3 py-3 text-base font-bold text-[#e8dff5] placeholder:text-[#e8dff5]/30 focus:border-[#c77dff] focus:outline-none transition-colors";

	return (
		<div className="min-h-screen overflow-x-hidden bg-[#09070c] text-[#e8dff5] selection:bg-[#c77dff] selection:text-[#09070c]">
			<div className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-10">
				
				<Link
					to="/"
					className="inline-block border-2 border-[#1e162b] bg-[#15101f] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#e8dff5] transition-all hover:bg-[#c77dff] hover:text-[#09070c]"
				>
					← Todos os rolês
				</Link>

				{carregando && (
					<div className="mt-8 h-72 animate-pulse border-4 border-[#c77dff]/20 bg-[#c77dff]/5" />
				)}

				{!carregando && erroCarregar && (
					<p
						className="mt-8 border-4 border-[#d45d8a] bg-[#d45d8a]/10 p-4 text-sm font-bold uppercase text-[#d45d8a]"
						role="alert"
					>
						{erroCarregar}
					</p>
				)}

				{!carregando && !erroCarregar && !evento && (
					<div className="mt-8 border-4 border-dashed border-[#e8dff5]/40 bg-[#15101f] p-8 text-center">
						<p className="font-orbitron text-4xl font-black uppercase text-[#c77dff]">
							Eita!
						</p>
						<p className="mt-3 text-sm font-bold uppercase tracking-widest text-[#e8dff5]/60">
							Esse evento não existe ou já saiu de cartaz.
						</p>
					</div>
				)}

				{evento && (
					<div className="mt-8 flex flex-col lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
						
						{/* COLUNA DA DIREITA NO PC (Detalhes e Descrição) */}
						<section className="lg:col-start-6 lg:col-span-7 lg:row-start-1 relative border-4 border-[#1e162b] bg-[#15101f] shadow-[6px_6px_0_#c77dff] sm:shadow-[8px_8px_0_#c77dff]">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#e8dff5]/40 border-2 border-[#1e162b]/20 rotate-2 z-10 backdrop-blur-sm"></div>
							
							<div className="flex">
								<div className="flex w-24 shrink-0 flex-col items-center justify-center overflow-hidden border-r-4 border-[#1e162b] bg-[#c77dff] p-2 text-center text-[#09070c] sm:w-32 sm:p-3">
									<span className="font-orbitron text-5xl font-black leading-none sm:text-7xl">
										{dia}
									</span>
									<span className="mt-1 text-sm font-black tracking-widest sm:text-base">
										{mes}
									</span>
									{ano && (
										<span className="text-[10px] font-bold tracking-widest">
											{ano}
										</span>
									)}
								</div>

								<div className="min-w-0 flex-1 p-4">
									<h1 className="break-words font-orbitron text-2xl sm:text-4xl font-black uppercase leading-tight text-[#e8dff5] drop-shadow-[2px_2px_0_#1e162b]">
										{evento.nome}
									</h1>
									{dataCompleta && (
										<p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#e8dff5]/70 sm:text-sm">
											{dataCompleta}
										</p>
									)}
									{evento.horario && (
										<p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#d45d8a] sm:text-sm">
											Abertura às {evento.horario}
										</p>
									)}
								</div>
							</div>

							{bandas.length > 0 && (
								<div className="border-t-4 border-dashed border-[#1e162b] p-4">
									<h2 className="font-orbitron text-xs font-black uppercase tracking-[0.3em] text-[#d45d8a]">
										Line-up
									</h2>
									<div className="mt-3 flex flex-wrap gap-2">
										{bandas.map((banda) => (
											<span
												key={banda}
												className="max-w-full break-words border-2 border-[#c77dff]/50 bg-[#c77dff]/10 px-2 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#e8dff5]"
											>
												{banda}
											</span>
										))}
									</div>
								</div>
							)}

							{/* @ts-ignore */}
							{(evento as any).descricao && (
								<div className="border-t-4 border-dashed border-[#1e162b] p-4">
									<h2 className="font-orbitron text-xs font-black uppercase tracking-[0.3em] text-[#c77dff] mb-2">
										Sobre o rolê
									</h2>
									<div className="text-sm leading-relaxed tracking-wide text-[#e8dff5]/80 whitespace-pre-wrap">
										{/* @ts-ignore */}
										{(evento as any).descricao}
									</div>
								</div>
							)}
						</section>

						{/* COLUNA DA ESQUERDA NO PC (Flyer + Form) */}
						<div className="mt-10 lg:mt-0 lg:col-start-1 lg:col-span-5 lg:row-start-1 flex flex-col gap-10">
							
						{/* Flyer */}
						{evento.flyer && !flyerQuebrado && (
							<div className="border-4 border-[#1e162b] bg-[#15101f] p-3 sm:p-4 shadow-[6px_6px_0_#d45d8a] sm:shadow-[8px_8px_0_#d45d8a]">
								<button
									type="button"
									onClick={() => setModalFlyerAberto(true)}
									className="group relative mx-auto block w-full max-w-md text-left cursor-zoom-in"
									title="Clique para ampliar o flyer"
								>
									<img
										src={evento.flyer}
										alt={`Flyer de ${evento.nome}`}
										loading="lazy"
										onError={() => setFlyerQuebrado(true)}
										className="block h-auto w-full border-4 border-[#1e162b] bg-[#09070c] object-contain transition duration-150 group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0_#c77dff]"
									/>
									<span className="absolute bottom-2 right-2 bg-[#09070c] border-2 border-[#1e162b] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[#e8dff5] shadow-[2px_2px_0_#1e162b]">
										Ampliar ⤢
									</span>
								</button>
							</div>
						)}

							{/* Formulário */}
							<section className="border-4 border-[#1e162b] bg-[#15101f] p-4 shadow-[6px_6px_0_#c77dff] sm:p-6 sm:shadow-[8px_8px_0_#c77dff]">
								{!ingressoCriado ? (
									<>
										<h2 className="font-orbitron inline-block border-b-4 border-[#d45d8a] text-xl font-black uppercase tracking-widest text-[#e8dff5] sm:text-2xl">
											Garanta seu ingresso
										</h2>
										<p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#e8dff5]/60">
											Preenche aí, a gente registra seu nome na lista.
										</p>

										<form
											onSubmit={enviarInscricao}
											className="mt-6 space-y-5"
											noValidate
										>
											<div>
												<label
													htmlFor="nome"
													className="text-xs font-black uppercase tracking-widest text-[#c77dff]"
												>
													Nome completo
												</label>
												<input
													id="nome"
													name="nome"
													autoComplete="name"
													className={inputClasse}
													placeholder="Ex: Gustavo Ferreira"
													value={nome}
													onChange={(e) => setNome(e.target.value)}
													required
												/>
											</div>

											<div>
												<label
													htmlFor="telefone"
													className="text-xs font-black uppercase tracking-widest text-[#c77dff]"
												>
													Telefone <span className="text-[#e8dff5]/50">(opcional)</span>
												</label>
												<input
													id="telefone"
													name="telefone"
													type="tel"
													inputMode="numeric"
													autoComplete="tel-national"
													className={inputClasse}
													placeholder="(13) 99999-9999"
													value={telefone}
													onChange={(e) =>
														setTelefone(mascararTelefone(e.target.value))
													}
												/>
											</div>
											<div>
												<label
													htmlFor="instagram"
													className="text-xs font-black uppercase tracking-widest text-[#c77dff]"
												>
													Instagram <span className="text-[#e8dff5]/50">(opcional)</span>
												</label>
												<input
													id="instagram"
													name="instagram"
													type="text"
													className={inputClasse}
													placeholder="Ex: @selopulsars"
													value={instagram}
													onChange={(e) => setInstagram(e.target.value)}
												/>
											</div>

											{erroForm && (
												<p
													className="border-4 border-[#d45d8a] bg-[#d45d8a]/10 p-3 text-sm font-bold text-[#d45d8a]"
													role="alert"
												>
													{erroForm}
												</p>
											)}

											<button
												type="submit"
												disabled={salvando}
												className="w-full cursor-pointer border-4 border-[#1e162b] bg-[#c77dff] px-4 py-4 font-orbitron text-base font-black uppercase tracking-[0.2em] text-[#09070c] shadow-[4px_4px_0_#1e162b] transition-all hover:-translate-y-1 hover:bg-[#d45d8a] hover:shadow-[6px_6px_0_#1e162b] active:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#1e162b] disabled:text-[#e8dff5]/30 disabled:shadow-none"
											>
												{salvando ? "Salvando..." : "Gerar meu ingresso"}
											</button>
										</form>
									</>
								) : (
									<div className="text-center py-4">
										<p className="font-orbitron text-4xl font-black uppercase text-[#d45d8a] drop-shadow-[2px_2px_0_#1e162b]">
											Tá na lista!
										</p>
										<p className="mt-4 text-sm font-bold uppercase tracking-widest text-[#e8dff5]/80">
											Seu pedido foi registrado como pendente,{" "}
											<span className="text-[#c77dff]">{nome.trim().split(" ")[0]}</span>.
										</p>
										<p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#e8dff5]/50">
											Você pode mandar o pix pro {MINHA_CHAVE_PIX} e enviar o comprovante clicando abaixo. Da um salve lá! 
										</p>

										<a
											href={linkWhatsApp}
											target="_blank"
											rel="noopener noreferrer"
											className="mt-8 block w-full border-4 border-[#1e162b] bg-[#25d366] px-4 py-4 font-orbitron text-base font-black uppercase tracking-[0.15em] text-[#09070c] shadow-[4px_4px_0_#1e162b] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#1e162b] active:translate-y-0"
										>
											Chamar no WhatsApp →
										</a>
									</div>
								)}
							</section>
						</div>

					</div>
				)}
			</div>
			{/* MODAL DO FLYER EM TELA CHEIA */}
				{modalFlyerAberto && evento && evento.flyer && (
					<div
						role="dialog"
						aria-modal="true"
						onClick={() => setModalFlyerAberto(false)}
						className="fixed inset-0 z-50 flex items-center justify-center bg-[#09070c]/90 p-4 backdrop-blur-sm cursor-zoom-out animate-fadeIn"
					>
						<div 
							onClick={(e) => e.stopPropagation()} 
							className="relative max-h-[90vh] max-w-2xl border-4 border-[#1e162b] bg-[#15101f] p-2 sm:p-3 shadow-[8px_8px_0_#c77dff] cursor-default"
						>
							{/* Botão de Fechar */}
							<button
								type="button"
								onClick={() => setModalFlyerAberto(false)}
								className="absolute -top-11 right-0 border-2 border-[#1e162b] bg-[#d45d8a] px-3 py-1 font-orbitron text-xs font-black uppercase text-[#09070c] shadow-[3px_3px_0_#1e162b] hover:bg-[#c77dff] active:translate-x-0.5 active:translate-y-0.5"
							>
								✕ Fechar
							</button>

							{/* Imagem em Alta Resolução */}
							<img
								src={evento.flyer}
								alt={`Flyer completo de ${evento.nome}`}
								className="max-h-[80vh] w-auto max-w-full object-contain border-2 border-[#1e162b]"
							/>
						</div>
					</div>
				)}
		</div>
		
	);
}

export default Event;