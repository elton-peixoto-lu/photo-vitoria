<script>
    import { user } from '$lib/authStore';
    import { auth } from '$lib/firebase';
    import { onMount } from 'svelte';

    const FOLDERS = [
        { value: 'casamentos', label: 'Casamentos' },
        { value: 'infantil', label: 'Infantil' },
        { value: 'femininos', label: 'Femininos' },
        { value: 'pre-weding', label: 'Pre-Weding' },
        { value: 'noivas', label: 'Noivas' },
    ];

    let folder = $state('casamentos');
    let files = $state([]);
    let status = $state('');
    let prUrl = $state('');
    let submitting = $state(false);
    let totalMb = $derived(files.reduce((total, file) => total + file.size, 0) / 1024 / 1024);

    const adminApiUrl = import.meta.env.VITE_ADMIN_API_URL || 'https://photo-vitoria-admin-api-rxpgnk6khq-uc.a.run.app';

    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                resolve(result.includes(',') ? result.split(',')[1] : result);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        status = '';
        prUrl = '';

        if (files.length === 0) {
            status = 'Selecione pelo menos uma foto.';
            return;
        }

        if (totalMb > 20) {
            status = 'O limite por lote é de 20MB.';
            return;
        }

        submitting = true;

        try {
            // Pegar o token do Firebase
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("Sessão expirada.");

            const payloadFiles = await Promise.all(files.map(async (file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
                contentBase64: await fileToBase64(file),
            })));

            const response = await fetch(`${adminApiUrl}/api/admin/gallery-pr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ folder, files: payloadFiles }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha ao enviar fotos');

            prUrl = data.pullRequestUrl;
            files = [];
            status = 'Sucesso! As fotos foram enviadas e estão sendo processadas.';
        } catch (error) {
            console.error(error);
            status = error.message || 'Erro ao enviar fotos.';
        } finally {
            submitting = false;
        }
    }

    function handleFileChange(e) {
        files = Array.from(e.target.files || []);
    }
</script>

<div class="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <header class="mb-12">
        <h2 class="text-3xl font-['Playfair_Display'] text-gray-900 mb-2">Gestão de Galerias</h2>
        <p class="text-xs uppercase tracking-[0.2em] text-gray-400 font-light">Upload e organização de portfólio</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Form Section -->
        <div class="lg:col-span-2 space-y-8">
            <div class="bg-white border border-gray-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <form onsubmit={handleSubmit} class="space-y-8">
                    <div class="space-y-4">
                        <label class="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">
                            1. Selecione a Categoria
                        </label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {#each FOLDERS as item}
                                <button
                                    type="button"
                                    onclick={() => folder = item.value}
                                    class="py-3 px-4 text-[10px] uppercase tracking-widest border transition-all {folder === item.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-transparent text-gray-400 border-gray-100 hover:border-pink-200 hover:text-pink-400'}"
                                >
                                    {item.label}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="space-y-4">
                        <label class="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">
                            2. Fotos para Upload
                        </label>
                        <div class="relative group">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onchange={handleFileChange}
                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div class="border-2 border-dashed border-gray-100 rounded-lg p-12 text-center group-hover:border-pink-200 transition-colors">
                                <div class="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                </div>
                                <p class="text-xs text-gray-500 uppercase tracking-widest">Clique ou arraste as fotos aqui</p>
                                <p class="text-[9px] text-gray-300 mt-2 uppercase tracking-widest">JPG, PNG ou WebP até 20MB</p>
                            </div>
                        </div>
                    </div>

                    {#if files.length > 0}
                        <div class="bg-gray-50/50 p-6 space-y-4 animate-in fade-in duration-500">
                            <div class="flex justify-between items-center pb-4 border-b border-gray-100">
                                <p class="text-[10px] uppercase tracking-widest text-gray-900 font-bold">{files.length} arquivos selecionados</p>
                                <p class="text-[10px] uppercase tracking-widest text-pink-400 font-bold">{totalMb.toFixed(2)} MB</p>
                            </div>
                            <div class="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {#each files as file}
                                    <div class="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest py-1">
                                        <span class="truncate pr-4">{file.name}</span>
                                        <span class="flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <button
                        type="submit"
                        disabled={submitting || files.length === 0}
                        class="w-full bg-gray-900 text-white py-5 text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-black transition-all disabled:bg-gray-100 disabled:text-gray-300 shadow-xl hover:shadow-2xl"
                    >
                        {submitting ? 'Processando Envío...' : 'Publicar na Galeria'}
                    </button>
                </form>
            </div>
        </div>

        <!-- Info Section -->
        <div class="space-y-6">
            <div class="bg-white border border-gray-100 p-8">
                <h3 class="text-[11px] uppercase tracking-[0.3em] text-gray-900 font-bold mb-6 pb-4 border-b border-gray-50">Status & Feedback</h3>
                
                {#if status}
                    <div class="p-4 {status.includes('Sucesso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} text-[10px] uppercase tracking-widest font-bold leading-relaxed mb-6">
                        {status}
                    </div>
                {/if}

                {#if prUrl}
                    <a href={prUrl} target="_blank" class="block w-full text-center py-4 bg-gray-50 text-gray-900 text-[9px] uppercase tracking-[0.3em] font-bold hover:bg-gray-100 transition-all border border-gray-100 mb-6">
                        Ver Pull Request no GitHub
                    </a>
                {/if}

                <div class="space-y-4">
                    <div class="flex items-start gap-3">
                        <div class="w-4 h-4 rounded-full bg-pink-100 flex-shrink-0 mt-0.5"></div>
                        <p class="text-[9px] uppercase tracking-widest text-gray-400 leading-relaxed">As fotos são processadas automaticamente via Cloudinary.</p>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="w-4 h-4 rounded-full bg-gray-100 flex-shrink-0 mt-0.5"></div>
                        <p class="text-[9px] uppercase tracking-widest text-gray-400 leading-relaxed">A atualização no site pode levar até 2 minutos.</p>
                    </div>
                </div>
            </div>

            <div class="bg-gray-900 p-8 text-white">
                <h3 class="text-[11px] uppercase tracking-[0.3em] font-bold mb-4">Dica de Curadoria</h3>
                <p class="text-[10px] font-light leading-relaxed text-gray-400 italic">
                    "A qualidade supera a quantidade. Escolha as 10 melhores fotos de cada ensaio para manter a galeria leve e impactante."
                </p>
            </div>
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e2e2;
    }
</style>
