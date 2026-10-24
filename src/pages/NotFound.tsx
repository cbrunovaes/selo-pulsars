import { Link } from "react-router";

function NotFound() {
	return (
		<div className="flex min-h-screen flex-col overflow-x-hidden bg-[#09070c] bg-[radial-gradient(#e8dff514_1px,transparent_1px)] bg-size-[6px_6px] font-sans text-[#e8dff5]">
			{/* Topo */}
			<header className="px-4 pb-6 pt-10 text-center sm:px-5 sm:pb-8 sm:pt-12">
				<p className="inline-block -rotate-2 border-2 border-[#1e162b] bg-[#d45d8a] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#09070c] shadow-[2px_2px_0_#1e162b] sm:text-xs sm:tracking-[0.3em]">
					erro 404
				</p>
				<h1 className="mt-4 wrap-break-word font-orbitron text-7xl font-black uppercase leading-none tracking-widest text-[#c77dff] drop-shadow-[3px_3px_0_#1e162b] sm:text-9xl sm:drop-shadow-[5px_5px_0_#1e162b]">
					404
				</h1>
			</header>

			{/* Fita */}
			<div className="relative w-full overflow-hidden py-3">
				<div className="-rotate-1 w-[105%] -translate-x-[2.5%] overflow-hidden whitespace-nowrap border-y-4 border-[#1e162b] bg-[#c77dff] py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#09070c] sm:text-sm sm:tracking-[0.35em]">
					★ página não encontrada ★ som alto ★{" "}
					<span className="hidden sm:inline">sem frescura ★ faça você mesmo ★</span>
				</div>
			</div>

			{/* Conteúdo */}
			<main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10 sm:px-5 sm:py-12">
				<div className="pr-1.5 sm:pr-2">
					<div className="-rotate-1 border-4 border-[#1e162b] bg-[#15101f] shadow-[5px_5px_0_#d45d8a] sm:shadow-[8px_8px_0_#d45d8a]">
						<div className="p-5 text-center sm:p-8">
							<h2 className="wrap-break-word font-orbitron text-2xl font-black uppercase leading-tight tracking-widest text-[#e8dff5] sm:text-4xl">
								Esse rolê não existe
							</h2>
							<p className="mx-auto mt-3 max-w-sm text-xs font-bold uppercase tracking-widest text-[#e8dff5]/70 sm:text-sm">
								O link tá errado, a página foi removida ou o ingresso já foi
								rasgado na portaria.
							</p>
						</div>

						{/* Picote do ingresso */}
						<Link
							to="/"
							className="group block border-t-4 border-dashed border-[#1e162b] bg-[#d45d8a] px-3 py-3 text-center font-orbitron text-xs font-black uppercase tracking-[0.2em] text-[#09070c] transition hover:bg-[#c77dff] sm:px-4 sm:text-sm sm:tracking-[0.25em]"
						>
							← Voltar pros rolês
						</Link>
					</div>
				</div>
			</main>

			<footer className="border-t-4 border-[#1e162b] px-4 py-8 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#e8dff5]/40 sm:text-xs">
				Apoie a cena local
			</footer>
		</div>
	);
}

export default NotFound;