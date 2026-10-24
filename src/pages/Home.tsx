import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../services/supabaseClient";

type Evento = {
	id: number;
	nome: string;
	data: string;
	horario: string | null;
	bandas: string | null;
};

// Aceita "24/10/2026" e "2026-10-24" (ou ISO com hora)
function parseData(data: string | null): Date | null {
	if (!data) return null;
	const s = data.trim();

	const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));

	const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

	return null;
}

function formatarData(data: string | null) {
	const d = parseData(data);
	if (!d) return { dia: "??", mes: "EM BREVE", ano: "" };
	return {
		dia: String(d.getDate()).padStart(2, "0"),
		mes: d
			.toLocaleDateString("pt-BR", { month: "short" })
			.replace(".", "")
			.toUpperCase(),
		ano: String(d.getFullYear()),
	};
}

function listarBandas(bandas: string | null) {
	if (!bandas) return [];
	return bandas
		.split(/[;,\n]/)
		.map((b) => b.trim())
		.filter(Boolean);
}

function Home() {
	const [eventos, setEventos] = useState<Evento[]>([]);
	const [carregando, setCarregando] = useState(true);
	const [erro, setErro] = useState("");

	useEffect(() => {
		async function carregarEventos() {
			const { data, error } = await supabase.from("eventos").select("*");

			if (error) {
				console.error("Erro ao buscar eventos:", error);
				setErro("Não deu pra carregar os eventos. Tenta de novo.");
			} else {
				const ordenados = ((data ?? []) as Evento[]).sort((a, b) => {
					const ta = parseData(a.data)?.getTime() ?? -Infinity;
					const tb = parseData(b.data)?.getTime() ?? -Infinity;
					return tb - ta; // mais novo primeiro
				});
				setEventos(ordenados);
			}
			setCarregando(false);
		}

		carregarEventos();
	}, []);

	const fotosHistorico = Array.from({ length: 13 }, (_, i) => `/historico/evento${i + 1}.png`);

return (
        <div className="min-h-screen overflow-x-hidden bg-[#09070c] text-[#e8dff5] selection:bg-[#c77dff] selection:text-[#09070c]">
            
            {/* ========================================================= */}
            {/* HERO PRINCIPAL: FOTOS DE FUNDO + TEXTOS POR CIMA           */}
            {/* ========================================================= */}
            {/* min-h-[480px] no mobile e sm:min-h-[580px] no PC para dar o tamanho grande que você queria */}
            <header className="relative w-full overflow-hidden min-h-[480px] sm:min-h-[580px] flex flex-col justify-center items-center px-4 py-12 text-center">

                {/* 1. ANIMAÇÃO DE ROLAGEM INFINITA PARA A ESQUERDA (CSS PURO) */}
                {/* 45s é uma velocidade suave. Diminua para 30s se quiser mais rápido, ou 60s se quiser mais lento */}
                <style>{`
                    @keyframes scrollInfinito {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .trilho-fotos {
                        display: flex;
                        width: max-content;
                        animation: scrollInfinito 55s linear infinite;
                    }
                `}</style>

                {/* 2. CAMADA DE FUNDO (FOTOS ROLANDO) */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    
                    {/* Duplicamos a lista de fotos [...fotosHistorico, ...fotosHistorico] 
                        para que quando o primeiro bloco acabar, o segundo já esteja entrando sem emendas */}
                    <div className="trilho-fotos h-full">
                        {[...fotosHistorico, ...fotosHistorico].map((src, index) => (
                            <div
                                key={index}
                                /* Ajuste a largura das fotos no fundo aqui: w-72 (mobile) e sm:w-96 (PC) */
                                className="h-full w-72 sm:w-96 shrink-0 overflow-hidden border-r border-[#1e162b]/60"
                            >
                                <img
                                    src={src}
                                    alt={`Foto evento ${index + 1}`}
                                    loading="lazy"
                                    /* object-cover estica na proporção correta; 
                                       contrast e saturate dão a pegada de filme 70s sem estourar */
                                    className="h-full w-full object-cover saturate-75 contrast-125 blur-[0.4px] brightness-90"
                                />
                            </div>
                        ))}
                    </div>

                    {/* 3. PELÍCULA ESCURA E GRADIENTE (MUITO IMPORTANTE PARA LEITURA) */}
                    {/* Se achar que as fotos estão muito escuras, troque bg-[#09070c]/75 por /60 ou /50 */}
                    <div className="absolute inset-0 bg-[#09070c]/75 mix-blend-multiply" />
                    
                    {/* Gradiente vertical que funde as fotos suavemente no topo e na base preta */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#09070c]/90 via-transparent to-[#09070c]" />
                </div>

                {/* ========================================================= */}
                {/* 4. CAMADA DA FRENTE (LOGO, TÍTULO E SUBTÍTULO)            */}
                {/* O 'relative z-10' garante que tudo aqui fique por cima das fotos */}
                {/* ========================================================= */}
                <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
                    
                    {/* LOGO PULSARS (ajuste o tamanho em w-28 / sm:w-36 se quiser maior) */}
                    <div className="mb-4 transition-transform duration-300 hover:scale-105">
                        <img 
                            src="/logo.png" 
                            alt="Pulsars Records Logo" 
                            className="h-28 w-28 sm:h-36 sm:w-36 rounded-full aspect-square object-cover border-2 border-[#c77dff]/60 shadow-[0_0_20px_rgba(199,125,255,0.25)] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                        />
                    </div>

                    {/* TÍTULO INGRESSOS PULSARS COM SOMBRA FORTE */}
                    <h1 className="wrap-break-word font-orbitron font-black text-4xl uppercase leading-none tracking-widest text-[#e8dff5] drop-shadow-[4px_4px_0_#09070c] sm:text-6xl sm:drop-shadow-[6px_6px_0_#09070c]">
                        Ingressos <span className="text-[#d45d8a]">Pulsars</span>
                    </h1>
                    
                    {/* SUBTÍTULO COM FUNDO TRANSLÚCIDO PARA LEITURA PERFEITA */}
                    <p className="mt-4 max-w-xs text-xs font-bold uppercase tracking-widest text-[#e8dff5] sm:mt-5 sm:max-w-md sm:text-sm drop-shadow-[2px_2px_0_#09070c] bg-[#09070c]/60 px-4 py-1.5 rounded border border-[#1e162b]/70">
                        Escolhe o rolê, entra na lista, faz o Pix e vem pra bagunça!
                    </p>
                </div>
            </header>

            {/* ========================================================= */}
            {/* FITA TICKER (SOM ALTO, DIY...) DIVISÓRIA                   */}
            {/* ========================================================= */}
            <div className="relative w-full overflow-hidden py-3">
                <div className="-rotate-1 w-[105%] -translate-x-[2.5%] border-y-4 border-[#1e162b] bg-[#c77dff] py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#09070c] sm:text-sm sm:tracking-[0.35em]">
                    <span className="sm:hidden">
                        ★ som alto ★ DIY ★ rolê independente ★ baderna ★ som alto ★
                    </span>
                    <span className="hidden sm:inline">
                        ★ som alto ★ DIY ★ rolê independente ★ faça você mesma ★ baderna ★
                    </span>
                </div>
            </div>
            {/* Lista Principal */}
            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-12">
                <h2 className="mb-8 inline-block border-b-4 border-[#d45d8a] font-orbitron text-xl font-black uppercase tracking-widest text-[#e8dff5] sm:text-2xl">
                    Próximos rolês
                </h2>
				
                {/* Loading */}
                {carregando && (
                    <div className="space-y-8">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-36 animate-pulse border-4 border-[#c77dff]/20 bg-[#c77dff]/5"
                            />
                        ))}
                    </div>
                )}

                {/* Erro */}
                {erro && (
                    <p
                        className="border-4 border-[#d45d8a] bg-[#d45d8a]/10 p-4 text-sm font-bold uppercase tracking-widest text-[#d45d8a]"
                        role="alert"
                    >
                        {erro}
                    </p>
                )}

                {/* Vazio */}
                {!carregando && !erro && eventos.length === 0 && (
                    <p className="border-4 border-dashed border-[#e8dff5]/30 p-6 text-center text-sm font-bold uppercase tracking-widest text-[#e8dff5]/60 sm:p-8">
                        Nenhum evento por enquanto. Fica de olho que logo sai um!
                    </p>
                )}

                {/* Grid de Eventos */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 pt-4">
                    {eventos.map((evento, i) => {
                        const { dia, mes, ano } = formatarData(evento.data);
                        const bandas = listarBandas(evento.bandas);

                        return (
                            <li key={evento.id} className="pr-1.5 sm:pr-2 pt-4">
                                <Link
                                    to={`/event/${evento.id}`}
                                    className={`group relative block border-4 border-[#1e162b] bg-[#15101f] shadow-[5px_5px_0_#c77dff] transition duration-150 hover:-translate-y-1 hover:rotate-0 hover:shadow-[8px_8px_0_#d45d8a] sm:shadow-[8px_8px_0_#c77dff] sm:hover:shadow-[12px_12px_0_#d45d8a] ${
                                        i % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1"
                                    }`}
                                >
                                    {/* Fita Crepe / Adesivo no topo do card */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#e8dff5]/40 border-2 border-[#1e162b]/20 rotate-[-3deg] z-10 backdrop-blur-sm transition-all group-hover:rotate-0 group-hover:bg-[#e8dff5]/60"></div>

                                    <div className="flex">
                                        {/* Bloco de Data */}
                                        <div className="flex w-20 shrink-0 flex-col items-center justify-center overflow-hidden border-r-4 border-[#1e162b] bg-[#c77dff] p-2 text-center text-[#09070c] sm:w-28 sm:p-3 transition-colors group-hover:bg-[#d45d8a]">
                                            <span className="font-orbitron text-4xl font-black leading-none sm:text-6xl">
                                                {dia}
                                            </span>
                                            <span className="mt-1 text-xs font-black tracking-widest sm:text-sm">
                                                {mes}
                                            </span>
                                            {ano && (
                                                <span className="text-[10px] font-bold tracking-widest">
                                                    {ano}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info do Evento */}
                                        <div className="min-w-0 flex-1 p-3 sm:p-4 relative">
                                            <h3 className="wrap-break-word font-orbitron text-xl font-black uppercase leading-tight tracking-tight text-[#e8dff5] sm:text-3xl">
                                                {evento.nome}
                                            </h3>

                                            {evento.horario && (
                                                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[#d45d8a] sm:text-xs">
                                                    Abertura às {evento.horario}
                                                </p>
                                            )}

                                            {/* Tags das Bandas */}
                                            {bandas.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {bandas.map((banda) => (
                                                        <span
                                                            key={banda}
                                                            className="max-w-full wrap-break-word border-2 border-[#c77dff]/50 bg-[#c77dff]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#e8dff5] sm:text-xs"
                                                        >
                                                            {banda}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Picote do ingresso */}
                                    <div className="border-t-4 border-dashed border-[#1e162b] bg-[#1e162b] px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#e8dff5] transition-all group-hover:bg-[#e8dff5] group-hover:text-[#09070c] sm:px-4 sm:text-sm sm:tracking-[0.25em]">
                                        Garantir ingresso →
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </main>

            <footer className="border-t-2 border-[#1e162b] px-4 py-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#e8dff5]/40 sm:text-xs">
                Apoie a cena local
            </footer>
        </div>
    );
}

export default Home;
