<script>
    import { auth } from '$lib/firebase';
    import { signInWithEmailAndPassword } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { Turnstile } from 'svelte-turnstile';
    import { user } from '$lib/authStore';

    let email = $state('');
    let password = $state('');
    let error = $state('');
    let loading = $state(false);
    let turnstileToken = $state('');

    $effect(() => {
        if ($user) {
            goto('/admin');
        }
    });

    async function handleLogin(e) {
        e.preventDefault();
        if (!turnstileToken) {
            error = "Por favor, complete o desafio de segurança.";
            return;
        }

        loading = true;
        error = '';
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            goto('/admin');
        } catch (err) {
            console.error(err);
            error = "E-mail ou senha incorretos.";
        } finally {
            loading = false;
        }
    }
</script>

<div class="flex items-center justify-center min-h-screen bg-white p-6 relative overflow-hidden">
    <!-- Subtle Background Element -->
    <div class="absolute -top-24 -right-24 w-96 h-96 bg-pink-50 rounded-full blur-3xl opacity-60"></div>
    <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-60"></div>

    <div class="w-full max-w-md z-10">
        <div class="text-center mb-12">
            <h1 class="text-3xl font-['Playfair_Display'] italic tracking-widest text-gray-800 uppercase mb-2">Photo Vitória</h1>
            <div class="h-px w-12 bg-pink-200 mx-auto mb-4"></div>
            <p class="text-xs uppercase tracking-[0.3em] text-gray-400 font-light">Painel de Administração</p>
        </div>

        <form onsubmit={handleLogin} class="bg-white border border-gray-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6">
            {#if error}
                <div class="bg-red-50 text-red-500 text-xs p-4 border-l-2 border-red-200 uppercase tracking-widest animate-pulse">
                    {error}
                </div>
            {/if}

            <div class="space-y-1">
                <label for="email" class="text-[10px] uppercase tracking-widest text-gray-400 font-medium">E-mail</label>
                <input 
                    type="email" 
                    id="email"
                    bind:value={email}
                    required
                    class="w-full bg-transparent border-b border-gray-200 py-3 text-sm focus:border-pink-300 outline-none transition-all placeholder:text-gray-200"
                    placeholder="exemplo@gmail.com"
                />
            </div>

            <div class="space-y-1">
                <label for="password" class="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Senha</label>
                <input 
                    type="password" 
                    id="password"
                    bind:value={password}
                    required
                    class="w-full bg-transparent border-b border-gray-200 py-3 text-sm focus:border-pink-300 outline-none transition-all placeholder:text-gray-200"
                    placeholder="••••••••"
                />
            </div>

            <div class="pt-4 flex justify-center">
                <Turnstile 
                    sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    on:callback={(e) => turnstileToken = e.detail.token}
                />
            </div>


            <button 
                type="submit" 
                disabled={loading}
                class="w-full bg-gray-900 text-white py-4 text-[10px] uppercase tracking-[0.4em] font-medium hover:bg-black transition-all shadow-xl disabled:bg-gray-200"
            >
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>

            <div class="text-center pt-4">
                <a href="/" class="text-[9px] uppercase tracking-widest text-gray-300 hover:text-pink-300 transition-all">Voltar para o site</a>
            </div>
        </form>
        
        <p class="text-[9px] text-center text-gray-400 mt-12 uppercase tracking-widest leading-relaxed">
            Acesso Restrito &copy; {new Date().getFullYear()} Photo Vitória<br/>
            Segurança via Google Firebase & Cloudflare
        </p>
    </div>
</div>
