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
            const turnstileResponse = await fetch('/api/auth/turnstile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: turnstileToken })
            });
            if (!turnstileResponse.ok) {
                error = "Validação de segurança falhou. Tente novamente.";
                return;
            }

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

<div class="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-['Inter'] relative overflow-hidden">
    <!-- Sophisticated Background -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div class="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-[120px]"></div>
        <div class="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gray-100/50 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-[440px] transition-all duration-700 ease-out" 
         class:opacity-0={loading} class:translate-y-4={loading}>
        
        <div class="text-center mb-10">
            <h1 class="text-4xl font-['Playfair_Display'] font-light tracking-[0.2em] text-gray-900 uppercase mb-3">
                Photo Vitória
            </h1>
            <div class="flex items-center justify-center gap-4 mb-4">
                <div class="h-[1px] w-8 bg-pink-200"></div>
                <span class="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-medium">Management Suite</span>
                <div class="h-[1px] w-8 bg-pink-200"></div>
            </div>
        </div>

        <div class="bg-white/80 backdrop-blur-xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-10 md:p-12">
            <form onsubmit={handleLogin} class="space-y-8">
                {#if error}
                    <div class="bg-red-50/50 border-l-2 border-red-400 p-4 animate-in fade-in slide-in-from-left-2 duration-300">
                        <p class="text-[10px] uppercase tracking-widest text-red-600 font-semibold">{error}</p>
                    </div>
                {/if}

                <div class="space-y-6">
                    <div class="relative group">
                        <label for="email" class="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2 transition-colors group-focus-within:text-pink-400">
                            Identificação
                        </label>
                        <input 
                            type="email" 
                            id="email"
                            bind:value={email}
                            required
                            placeholder="E-mail profissional"
                            class="w-full bg-transparent border-b border-gray-200 py-3 text-sm focus:border-gray-900 outline-none transition-all placeholder:text-gray-300 font-light"
                        />
                    </div>

                    <div class="relative group">
                        <label for="password" class="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2 transition-colors group-focus-within:text-pink-400">
                            Chave de Acesso
                        </label>
                        <input 
                            type="password" 
                            id="password"
                            bind:value={password}
                            required
                            placeholder="••••••••"
                            class="w-full bg-transparent border-b border-gray-200 py-3 text-sm focus:border-gray-900 outline-none transition-all placeholder:text-gray-300 font-light"
                        />
                    </div>
                </div>

                <div class="flex justify-center py-2 scale-90 opacity-90 hover:opacity-100 transition-opacity">
                    <Turnstile 
                        sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAADJksWK2ejJKf8NL'} 
                        on:callback={(e) => turnstileToken = e.detail.token}
                        theme="light"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    class="w-full bg-gray-900 text-white py-5 text-[10px] uppercase tracking-[0.5em] font-semibold hover:bg-black transition-all duration-500 shadow-lg hover:shadow-2xl disabled:bg-gray-200 disabled:shadow-none flex items-center justify-center gap-2"
                >
                    {#if loading}
                        <span class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Processando
                    {:else}
                        Autenticar
                    {/if}
                </button>
            </form>

            <div class="mt-10 pt-8 border-t border-gray-50 text-center">
                <a href="/" class="text-[9px] uppercase tracking-[0.3em] text-gray-300 hover:text-pink-400 transition-all duration-300">
                    Sair do ambiente restrito
                </a>
            </div>
        </div>

        <div class="mt-12 flex flex-col items-center gap-4">
            <p class="text-[9px] uppercase tracking-[0.4em] text-gray-300 text-center leading-loose">
                &copy; {new Date().getFullYear()} Photo Vitória Studio<br/>
                Digital Infrastructure by Google & Cloudflare
            </p>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background-color: #fafafa;
    }
    
    input:focus {
        background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5));
    }
</style>
