<script>
    import { user } from '$lib/authStore';
    import { goto } from '$app/navigation';

    $effect(() => {
        if ($user === null) {
            goto('/login');
        } else if ($user) {
            goto('/admin');
        }
    });
</script>

<div class="flex items-center justify-center min-h-screen">
    <div class="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
</div>
