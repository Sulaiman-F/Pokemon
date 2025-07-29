const PokemonAPI = 'https://pokeapi.co/api/v2';

export interface Pokemon {
	id: number;
	name: string;
	height: number;
	weight: number;
	sprites: {
		front_default: string;
		front_shiny: string;
		other: {
			'official-artwork': {
				front_default: string;
			};
		};
	};
	types: Array<{
		type: {
			name: string;
		};
	}>;
	stats: Array<{
		base_stat: number;
		stat: {
			name: string;
		};
	}>;
	abilities: Array<{
		ability: {
			name: string;
		};
		is_hidden: boolean;
	}>;
}

export interface PokemonListItem {
	name: string;
	url: string;
}

export interface PokemonListResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: PokemonListItem[];
}

export interface PokemonType {
	pokemon: Array<{
		pokemon: PokemonListItem;
	}>;
}

export async function getPokemonList(
	limit: number = 10,
	offset: number = 0
): Promise<PokemonListResponse> {
	const response = await fetch(`${PokemonAPI}/pokemon?limit=${limit}&offset=${offset}`);
	return await response.json();
}

export async function getPokemon(id: number | string): Promise<Pokemon> {
	const response = await fetch(`${PokemonAPI}/pokemon/${id}`);
	return await response.json();
}

export async function searchPokemon(searchTerm: string): Promise<PokemonListItem[]> {
	const response = await fetch(`${PokemonAPI}/pokemon?limit=1302`);
	const data: PokemonListResponse = await response.json();
	return data.results.filter((pokemon) =>
		pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
	);
}

export async function getPokemonByType(typeName: string): Promise<PokemonListItem[]> {
	const response = await fetch(`${PokemonAPI}/type/${typeName}`);
	const data: PokemonType = await response.json();
	return data.pokemon.map((p) => p.pokemon);
}

export async function getPokemonTypes() {
	const response = await fetch(`${PokemonAPI}/type`);
	const data = await response.json();
	return data.results;
}

export function getPokemonId(url: string): number {
	const parts = url.split('/');
	return parseInt(parts[parts.length - 2]);
}

export function capitalizeName(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

export function getSpriteUrl(id: number): string {
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}
