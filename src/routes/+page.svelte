<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import {
		getPokemonList,
		getPokemonId,
		capitalizeName,
		getSpriteUrl,
		getPokemon,
		getPokemonByType,
		getPokemonTypes,
		searchPokemon,
		type PokemonListItem,
		type Pokemon
	} from '$lib/api/pokemon.api';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SunMoon, Search, X } from 'lucide-svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let darkMode = false;
	const toggleDarkMode = () => {
		darkMode = !darkMode;
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	};
	let offset = 0;
	let isLoading = true;
	let isLoadingMore = false;
	let error: string | null = null;
	let allPokemon: (PokemonListItem & { id: number; name: string })[] = [];
	let searchResults: (PokemonListItem & { id: number; name: string })[] = [];
	let typeResults: (PokemonListItem & { id: number; name: string })[] = [];
	let pokemonTypes: { name: string; url: string }[] = [];
	let selectedType = '';
	let hasMore = true;
	let searchTerm = '';
	let selectedPokemon: Pokemon | null = null;
	let isLoadingDetail = true;
	const limit = 30;
	const totalPokemon = 1302;

	async function loadMorePokemon() {
		if (isLoadingMore || !hasMore) return;

		isLoadingMore = true;
		try {
			const response = await getPokemonList(limit, offset);
			const newPokemon = response.results.map((pokemon) => ({
				...pokemon,
				id: getPokemonId(pokemon.url),
				name: capitalizeName(pokemon.name)
			}));

			allPokemon = [...allPokemon, ...newPokemon];
			offset += limit;
			hasMore = offset < totalPokemon;
		} catch (err) {
			error = 'Failed to load more Pokémon data';
		} finally {
			isLoadingMore = false;
		}
	}

	function handleScroll(event: any) {
		if (searchTerm.trim() || selectedType) return;
		const { scrollTop, scrollHeight, clientHeight } = event.target;
		if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !isLoadingMore) {
			loadMorePokemon();
		}
	}

	async function handleCardClick(pokemonId: number) {
		isLoadingDetail = true;
		try {
			selectedPokemon = await getPokemon(pokemonId);
		} catch (err) {
			error = 'Failed to load Pokémon details';
		} finally {
			isLoadingDetail = false;
		}
	}

	function closeDetail() {
		selectedPokemon = null;
	}

	$: if (searchTerm.trim()) {
		searchPokemon(searchTerm)
			.then((results) => {
				searchResults = results.map((pokemon) => ({
					...pokemon,
					id: getPokemonId(pokemon.url),
					name: capitalizeName(pokemon.name)
				}));
			})
			.catch((err) => {
				error = 'Failed to search Pokémon';
			});
	} else {
		searchResults = [];
	}

	$: if (selectedType && selectedType !== '') {
		getPokemonByType(selectedType)
			.then((results) => {
				typeResults = results.map((pokemon) => ({
					...pokemon,
					id: getPokemonId(pokemon.url),
					name: capitalizeName(pokemon.name)
				}));
			})
			.catch((err) => {
				error = 'Failed to filter Pokémon by type';
			});
	} else {
		typeResults = [];
	}

	$: displayedPokemon = searchTerm.trim() ? searchResults : selectedType ? typeResults : allPokemon;

	onMount(async () => {
		try {
			const response = await getPokemonList(limit, offset);
			allPokemon = response.results.map((pokemon) => ({
				...pokemon,
				id: getPokemonId(pokemon.url),
				name: capitalizeName(pokemon.name)
			}));
			offset += limit;
			hasMore = offset < totalPokemon;

			const typesResponse = await getPokemonTypes();
			pokemonTypes = typesResponse;

			isLoading = false;
		} catch (err) {
			error = 'Failed to load Pokémon data';
			isLoading = false;
		}
	});
</script>

<div class="flex max-h-screen w-full flex-col">
	<nav class="flex w-full items-center justify-between p-4">
		<div class="flex items-center space-x-2">
			<img src="pokemonball.png" alt="" class="h-10 w-10" />
			<h1 class="text-2xl font-bold">Pokémon</h1>
		</div>
		<Button onclick={toggleDarkMode} variant="ghost" size="icon" class="size-8 cursor-pointer p-3">
			<SunMoon class="size-icon" />
		</Button>
	</nav>
	<div class="flex flex-col justify-center gap-y-5 px-7 pb-2 md:flex-row md:justify-center">
		<div class="flex w-full items-center justify-between gap-2 md:w-1/2">
			<Search class=" h-5 w-5 text-muted-foreground" />
			<input
				type="search"
				placeholder="Search Pokémon..."
				bind:value={searchTerm}
				class="w-full border-0 px-2 py-1 outline-0"
			/>
		</div>
		<div class="flex w-full justify-center md:w-1/2 md:justify-end">
			<Select.Root type="single" name="pokemonType" bind:value={selectedType}>
				<Select.Trigger class=" w-full text-base md:w-[300px]">
					{selectedType ? capitalizeName(selectedType) : 'Filter by type'}
				</Select.Trigger>
				<Select.Content class="h-72 w-full md:w-[300px]">
					<Select.Group>
						<Select.Label class="text-base">Pokemon Types</Select.Label>
						<Select.Item value="" label="All types">All types</Select.Item>
						{#each (pokemonTypes || []).slice(0, 18) as type (type.name)}
							<Select.Item value={type.name} label={capitalizeName(type.name)}>
								{capitalizeName(type.name)}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<div class="scrollbar-hide flex-1 overflow-y-auto p-4" on:scroll={handleScroll}>
		{#if error}
			<Alert.Root variant="destructive">
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{:else}
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#if isLoading}
					{#each Array(30) as _, i}
						<div class="flex rounded-lg border px-2 py-1 shadow">
							<Skeleton class="h-25 w-24 rounded" />
							<div class="ml-4 flex flex-col justify-center gap-2">
								<Skeleton class="h-6 w-32" />
								<Skeleton class="h-4 w-16" />
							</div>
						</div>
					{/each}
				{:else}
					{#if searchTerm.trim() && searchResults.length === 0}
						<div class="col-span-full py-8 text-center">
							<p class="text-gray-500">No Pokémon found matching "{searchTerm}"</p>
						</div>
					{:else if selectedType && typeResults.length === 0}
						<div class="col-span-full py-8 text-center">
							<p class="text-gray-500">No Pokémon found for type "{selectedType}"</p>
						</div>
					{/if}

					{#each displayedPokemon as pokemon (pokemon.id)}
						<button
							class="flex cursor-pointer rounded-lg border px-2 shadow transition-all duration-300 hover:scale-105 hover:shadow-lg"
							on:click={() => handleCardClick(pokemon.id)}
							in:scale={{ duration: 300, delay: Math.random() * 200, easing: quintOut }}
						>
							<img
								src={getSpriteUrl(pokemon.id)}
								alt={pokemon.name}
								class="h-30 w-fit"
								loading="lazy"
							/>

							<div class="flex w-full flex-col items-start justify-center gap-2">
								<h2 class="text-lg font-semibold lg:text-2xl">{pokemon.name}</h2>
								<p class="text-base text-neutral-600 lg:text-lg">#{pokemon.id}</p>
							</div>
						</button>
					{/each}

					{#if isLoadingMore && !searchTerm.trim() && !selectedType}
						{#each Array(6) as _, i}
							<div class="flex rounded-lg border px-2 py-1 shadow">
								<Skeleton class="h-25 w-24 rounded" />
								<div class="ml-4 flex flex-col justify-center gap-2">
									<Skeleton class="h-6 w-32" />
									<Skeleton class="h-4 w-16" />
								</div>
							</div>
						{/each}
					{/if}

					{#if !hasMore && allPokemon.length > 0 && !searchTerm.trim() && !selectedType}
						<div class="col-span-full py-4 text-center">
							<p class="text-gray-500">You've seen all {totalPokemon} Pokémon!</p>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Slide Panel -->
{#if selectedPokemon}
	<div class="fixed top-0 left-0 z-40 h-full w-full bg-black/10 backdrop-blur-xs">
		<div
			class=" scrollbar-hide fixed top-0 right-0 z-50 h-full w-screen overflow-y-auto bg-white md:overflow-y-hidden lg:w-1/2 dark:bg-[#111111]"
			in:fly={{ x: 300, duration: 300, easing: quintOut }}
			out:fly={{ x: 300, duration: 300 }}
		>
			<div class="flex flex-col gap-4 p-6">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-bold capitalize">{selectedPokemon.name}</h2>
					<button
						on:click={closeDetail}
						class="cursor-pointer text-neutral-700 transition-all duration-200 hover:text-neutral-900 dark:hover:text-neutral-300"
					>
						<X class="h-6 w-6" />
					</button>
				</div>

				{#if isLoadingDetail}
					<div class="flex gap-4">
						<Skeleton class="h-55 w-55 rounded" />

						<div class="flex w-1/2 flex-col justify-center gap-5">
							<div class="flex justify-between">
								<Skeleton class="h-6 w-32" />
							</div>
							<div class="flex justify-between">
								<Skeleton class="h-6 w-32" />
							</div>
						</div>
					</div>
				{:else}
					<div class="flex gap-4">
						<img
							src={selectedPokemon.sprites.front_default}
							alt={selectedPokemon.name}
							class="h-55 w-55"
							loading="lazy"
						/>

						<div class="flex w-1/2 flex-col justify-center gap-5">
							<div class="flex justify-between">
								<span class="font-semibold">Height:</span>
								<span>{selectedPokemon.height / 10} m</span>
							</div>
							<div class="flex justify-between">
								<span class="font-semibold">Weight:</span>
								<span>{selectedPokemon.weight / 10} kg</span>
							</div>
						</div>
					</div>
					<div class="flex w-full justify-between gap-2">
						<div class="flex w-1/2 flex-col gap-2">
							<span class="font-semibold">Types:</span>
							<div class="flex gap-2">
								{#each selectedPokemon.types as type}
									<Badge variant="secondary" class="capitalize md:text-sm">{type.type.name}</Badge>
								{/each}
							</div>
						</div>
						<div class="flex w-1/2 flex-col gap-2">
							<h3 class="font-semibold">Abilities:</h3>
							<div class="flex flex-wrap gap-2">
								{#each selectedPokemon.abilities as ability}
									<Badge variant="secondary" class="capitalize md:text-sm"
										>{ability.ability.name}</Badge
									>
								{/each}
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-4">
						<h3 class="text-lg font-semibold">Stats</h3>
						<div class="flex flex-col gap-3">
							{#each selectedPokemon.stats as stat}
								<div class="flex flex-col gap-1">
									<div class="flex justify-between">
										<span class="text-sm font-medium">{stat.stat.name.toUpperCase()}</span>
										<span class="text-sm md:text-base">{stat.base_stat}</span>
									</div>
									<Progress
										value={stat.base_stat}
										max={255}
										class="bg-gray-200 [&>div]:bg-blue-500"
									/>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		scrollbar-width: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
	}
</style>
