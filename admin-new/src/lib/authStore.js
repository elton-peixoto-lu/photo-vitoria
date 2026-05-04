import { writable } from 'svelte/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export const user = writable(undefined);

if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, (u) => {
        user.set(u);
    });
}
