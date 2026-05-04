<script>
    import { user } from '$lib/authStore';
    import { goto } from '$app/navigation';
    import { auth } from '$lib/firebase';
    import { signOut } from 'firebase/auth';
    import { onMount } from 'svelte';

    let { children } = $props();
    let loading = $state(true);

    $effect(() => {
        if (!$user && !loading) {
            goto('/login');
        }
    });

    onMount(() => {
        loading = false;
    });

    async function handleLogout() {
        await signOut(auth);
        goto('/login');
    }
</script>

{#if $user}
    <div class="min-h-screen bg-[#fafafa] font-['Inter'] flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
            <div class="p-8">
                <h1 class="text-xl font-['Playfair_Display'] tracking-widest text-gray-900 uppercase">Photo Vitória</h1>
                <p class="text-[9px] uppercase tracking-[0.3em] text-pink-400 mt-2">Admin Panel</p>
            </div>

            <nav class="flex-1 px-4 space-y-1">
                <a href="/admin" class="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-gray-900 bg-gray-50 font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                    Galerias
                </a>
                <a href="/admin/scheduling" class="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-transparent"></span>
                    Agendamentos
                </a>
                <a href="/admin/settings" class="flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-transparent"></span>
                    Configurações
                </a>
            </nav>

            <div class="p-8 border-t border-gray-50">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-[10px] text-pink-500 font-bold">
                        {($user.email || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] font-bold text-gray-900 truncate">{$user.email}</p>
                        <p class="text-[8px] uppercase tracking-widest text-gray-400">Administrador</p>
                    </div>
                </div>
                <button 
                    onclick={handleLogout}
                    class="w-full py-3 border border-gray-100 text-[9px] uppercase tracking-widest text-gray-400 hover:text-red-500 hover:border-red-100 transition-all font-bold"
                >
                    Encerrar Sessão
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-10 md:p-16">
            {@render children()}
        </main>
    </div>
{:else}
    <div class="min-h-screen bg-white flex items-center justify-center">
        <span class="w-8 h-8 border-2 border-gray-100 border-t-pink-400 rounded-full animate-spin"></span>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        background-color: #fafafa;
    }
</style>
