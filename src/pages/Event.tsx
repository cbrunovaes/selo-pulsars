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

// (13) 99999-9999
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
		if (digitos.length < 0) {
			setErroForm("Telefone inválido. Use DDD + número.");
			return;
		}

		setSalvando(true);
		setErroForm("");
		const instaLimpo = instagram.trim().replace(/^@+/, "");
		const contatoFinal = instaLimpo ? `${telefone} | @${instaLimpo}` : telefone;

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

	const linkWhatsApp = evento
		? `https://wa.me/${MEU_WHATSAPP}?text=${encodeURIComponent(
				`Olá! Me inscrevi na lista do evento *${evento.nome}*.\n\n` +
					`*Nome:* ${nome.trim()}\n` +
					`*Telefone:* ${telefone}\n` +
					`*Instagram:* ${instaFormatado}\n\n` +
					`Vou realizar o Pix na chave: *${MINHA_CHAVE_PIX}* e enviar o comprovante aqui para confirmar meu ingresso!`,
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
		"mt-1 w-full border-4 border-white bg-black px-3 py-3 text-base font-bold text-white placeholder:text-white/30 focus:border-[#ffe600] focus:outline-none";

	return (
		<div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:6px_6px] font-sans text-white">
			<div className="mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-10">
				<Link
					to="/"
					className="inline-block border-2 border-white px-3 py-1 text-xs font-black uppercase tracking-widest transition hover:bg-white hover:text-black"
				>
					← Todos os rolês
				</Link>

				{carregando && (
					<div className="mt-8 h-72 animate-pulse border-4 border-white/20 bg-white/5" />
				)}

				{!carregando && erroCarregar && (
					<p
						className="mt-8 border-4 border-red-500 bg-red-500/10 p-4 text-sm font-bold uppercase text-red-400"
						role="alert"
					>
						{erroCarregar}
					</p>
				)}

				{!carregando && !erroCarregar && !evento && (
					<div className="mt-8 border-4 border-dashed border-white/40 p-8 text-center">
						<p className="font-['Permanent_Marker',Impact,sans-serif] text-4xl uppercase text-[#ffe600]">
							Eita!
						</p>
						<p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/60">
							Esse evento não existe ou já saiu de cartaz.
						</p>
					</div>
				)}

				{evento && (
					<>
						{/* Detalhes */}
						<section className="mt-8 border-4 border-white bg-[#141414] shadow-[6px_6px_0_#ff2e63] sm:shadow-[8px_8px_0_#ff2e63]">
							<div className="flex">
								<div className="flex w-24 shrink-0 flex-col items-center justify-center overflow-hidden border-r-4 border-white bg-[#ffe600] p-2 text-center text-black sm:w-32 sm:p-3">
									<span className="text-5xl font-black leading-none sm:text-7xl">
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
									<h1 className="break-words font-['Permanent_Marker',Impact,sans-serif] text-3xl uppercase leading-tight text-[#ffe600] drop-shadow-[2px_2px_0_#ff2e63] sm:text-5xl sm:drop-shadow-[3px_3px_0_#ff2e63]">
										{evento.nome}
									</h1>
									{dataCompleta && (
										<p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/70 sm:text-sm">
											{dataCompleta}
										</p>
									)}
									{evento.horario && (
										<p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#ff2e63] sm:text-sm">
											Abertura às {evento.horario}
										</p>
									)}
								</div>
							</div>

							{/* Flyer */}
							{evento.flyer && !flyerQuebrado && (
								<div className="border-t-4 border-white bg-black p-3 sm:p-4">
									<a
										href={evento.flyer}
										target="_blank"
										rel="noopener noreferrer"
										className="group relative mx-auto block w-full max-w-md"
										title="Abrir flyer em tamanho cheio"
									>
										<img
											src={evento.flyer}
											alt={`Flyer de ${evento.nome}`}
											loading="lazy"
											onError={() => setFlyerQuebrado(true)}
											className="block h-auto w-full border-4 border-white bg-[#141414] object-contain shadow-[5px_5px_0_#ff2e63] transition duration-150 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_#ffe600] sm:shadow-[8px_8px_0_#ff2e63]"
										/>
										<span className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
											Ampliar ↗
										</span>
									</a>
								</div>
							)}

							{bandas.length > 0 && (
								<div className="border-t-4 border-dashed border-white p-4">
									<h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#ff2e63]">
										Line-up
									</h2>
									<div className="mt-3 flex flex-wrap gap-2">
										{bandas.map((banda) => (
											<span
												key={banda}
												className="max-w-full break-words border-2 border-white/70 px-2 py-1 text-xs font-black uppercase tracking-wider sm:text-sm"
											>
												{banda}
											</span>
										))}
									</div>
								</div>
							)}
						</section>

						{/* Ingresso */}
						<section className="mt-10 border-4 border-white bg-[#141414] p-4 shadow-[6px_6px_0_#ffe600] sm:p-6 sm:shadow-[8px_8px_0_#ffe600]">
							{!ingressoCriado ? (
								<>
									<h2 className="inline-block border-b-4 border-[#ff2e63] text-xl font-black uppercase tracking-widest sm:text-2xl">
										Garanta seu ingresso
									</h2>
									<p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/60">
										Preenche aí, a gente registra seu nome na lista.
									</p>

									<form
										onSubmit={enviarInscricao}
										className="mt-5 space-y-4"
										noValidate
									>
										<div>
											<label
												htmlFor="nome"
												className="text-xs font-black uppercase tracking-widest"
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
												className="text-xs font-black uppercase tracking-widest"
											>
												Telefone pra contato
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
												className="text-xs font-black uppercase tracking-widest"
											>
												Instagram (opcional)
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
												className="border-4 border-red-500 bg-red-500/10 p-3 text-sm font-bold text-red-400"
												role="alert"
											>
												{erroForm}
											</p>
										)}

										<button
											type="submit"
											disabled={salvando}
											className="w-full cursor-pointer border-4 border-white bg-[#ff2e63] px-4 py-4 text-base font-black uppercase tracking-[0.2em] text-black shadow-[4px_4px_0_#ffe600] transition hover:-translate-y-0.5 hover:bg-[#ffe600] hover:shadow-[6px_6px_0_#ff2e63] active:translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#555] disabled:shadow-none"
										>
											{salvando ? "Salvando..." : "Gerar meu ingresso"}
										</button>
									</form>
								</>
							) : (
								<div className="text-center">
									<p className="font-['Permanent_Marker',Impact,sans-serif] text-4xl uppercase text-[#ffe600] drop-shadow-[3px_3px_0_#ff2e63]">
										Tá na lista!
									</p>
									<p className="mt-4 text-sm font-bold uppercase tracking-widest text-white/80">
										Seu pedido foi registrado como pendente,{" "}
										{nome.trim().split(" ")[0]}.
									</p>
									<p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/50">
										Chama no WhatsApp pra combinar o Pix e confirmar seu
										ingresso.
									</p>

									<a
										href={linkWhatsApp}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-6 block w-full border-4 border-white bg-[#25d366] px-4 py-4 text-base font-black uppercase tracking-[0.15em] text-black shadow-[4px_4px_0_#ff2e63] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#ffe600]"
									>
										Chamar no WhatsApp →
									</a>
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</div>
	);
}

export default Event;
