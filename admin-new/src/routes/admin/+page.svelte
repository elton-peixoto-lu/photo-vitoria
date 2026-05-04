<script>
    import { auth } from '$lib/firebase';
    import { signOut } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { user } from '$lib/authStore';

    let loading = $state(false);

    $effect(() => {
        if ($user === null) {
            goto('/login');
        }
    });

    async function handleSignOut() {
        await signOut(auth);
        goto('/login');
    }
</script>

<div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-100 flex flex-col p-8">
        <div class="mb-12">
            <h2 class="text-xl font-['Playfair_Display'] italic tracking-wider text-gray-800">Admin</h2>
        </div>

        <nav class="flex-1 space-y-4">
            <a href="/admin" class="block text-[10px] uppercase tracking-widest text-pink-500 font-semibold border-b border-pink-100 pb-2">Galeria</a>
            <a href="/admin/promocoes" class="block text-[10px] uppercase tracking-widest text-gray-400 hover:text-pink-400 transition-all">Promoções</a>
            <a href="/admin/configuracoes" class="block text-[10px] uppercase tracking-widest text-gray-400 hover:text-pink-400 transition-all">Configurações</a>
        </nav>

        <div class="pt-8 border-t border-gray-50">
            <button 
                onclick={handleSignOut}
                class="text-[10px] uppercase tracking-widest text-gray-400 hover:text-red-400 transition-all flex items-center gap-2"
            >
                Sair do Sistema
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-12 bg-[#fafafa]">
        <header class="flex justify-between items-end mb-12">
            <div>
                <h1 class="text-4xl font-extralight tracking-tight text-gray-800 mb-2">Galeria de Fotos</h1>
                <p class="text-[10px] uppercase tracking-[0.3em] text-gray-400">Gerencie as imagens exibidas no portfólio</p>
            </div>
            
            <button class="bg-gray-900 text-white px-8 py-3 text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg">
                Upload de Imagens
            </button>
        </header>

        <!-- Gallery Grid Placeholder -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {#each Array(8) as _, i}
                <div class="aspect-[3/4] bg-white border border-gray-100 shadow-sm relative group overflow-hidden">
                    <div class="absolute inset-0 bg-gray-50 flex items-center justify-center text-gray-200 uppercase tracking-widest text-[10px]">
                        Imagem {i + 1}
                    </div>
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button class="text-white text-[9px] uppercase tracking-widest border border-white/40 px-4 py-2 hover:bg-white hover:text-black transition-all">Excluir</button>
                    </div>
                </div>
            {/each}
        </div>
    </main>
</div>
