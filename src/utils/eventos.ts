export type Evento = {
	id: number;
	nome: string;
	data: string | null;
	horario: string | null;
	bandas: string | null;
	flyer: string | null;
};

// Aceita "24/10/2026" e "2026-10-24" (ou ISO com hora)
export function parseData(data: string | null): Date | null {
	if (!data) return null;
	const s = data.trim();

	const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
	if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));

	const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

	return null;
}

export function formatarData(data: string | null) {
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

export function listarBandas(bandas: string | null) {
	if (!bandas) return [];
	return bandas
		.split(/[;,\n]/)
		.map((b) => b.trim())
		.filter(Boolean);
}
