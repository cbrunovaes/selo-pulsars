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

return (
        <div className="min-h-screen overflow-x-hidden bg-[#09070c] text-[#e8dff5] selection:bg-[#c77dff] selection:text-[#09070c]">
            
            {/* Topo com Logo estilo Fanzine/Impressão */}
            <header className="px-4 pb-8 pt-12 text-center sm:px-5 sm:pb-10 sm:pt-14 flex flex-col items-center">
                <div className="relative mb-8 group">
                    {/* Sombra dura deslocada estilo offset por trás da imagem */}
                    <div className="absolute inset-0 bg-[#d45d8a] translate-x-3 translate-y-3 border-2 border-[#1e162b]"></div>
                    {/* Logo com borda pesada imitando um adesivo quadrado rotacionado */}
                    <img 
                        src="/logo.png" 
                        alt="Selo Pulsars" 
                        className="w-40 md:w-48 h-auto relative z-10 border-4 border-[#1e162b] transform -rotate-3 transition-transform group-hover:-rotate-1"
                    />
                </div>
                
                {/* Título com cores contrastantes separadas e sombra escura pra leitura */}
                <h1 className="mt-2 wrap-break-word font-orbitron font-black text-4xl uppercase leading-none tracking-widest text-[#e8dff5] drop-shadow-[3px_3px_0_#1e162b] sm:text-6xl sm:drop-shadow-[5px_5px_0_#1e162b]">
                    Ingressos <span className="text-[#d45d8a]">Pulsars</span>
                </h1>
                
                <p className="mx-auto mt-4 max-w-xs text-xs font-bold uppercase tracking-widest text-[#e8dff5]/70 sm:mt-5 sm:max-w-md sm:text-sm">
                    Escolhe o rolê, entra na lista, faz o Pix e vem pra bagunça!
                </p>
            </header>

            {/* Fita Ticker */}
            <div className="-rotate-1 scale-105 overflow-hidden whitespace-nowrap border-y-4 border-[#1e162b] bg-[#c77dff] py-2 text-center text-[10px] font-black uppercase tracking-[0.25em] text-[#09070c] sm:text-sm sm:tracking-[0.35em]">
                ★ som alto ★ DIY ★{" "}
                <span className="hidden sm:inline">
                    rolê independente ★ faça você mesma ★ baderna ★
                </span>
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
