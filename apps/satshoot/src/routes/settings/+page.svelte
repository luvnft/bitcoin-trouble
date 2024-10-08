<script lang="ts">
import ndk, { sessionPK } from '$lib/stores/ndk';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';
import { getModalStore, LightSwitch, type ModalSettings } from '@skeletonlabs/skeleton';
import { getToastStore } from '@skeletonlabs/skeleton';
import type { ToastSettings } from '@skeletonlabs/skeleton';
import { clipboard } from '@skeletonlabs/skeleton';
import Dexie from 'dexie';
import { onDestroy } from 'svelte';
import { nsecEncode } from "nostr-tools/nip19"
import { hexToBytes } from '@noble/ciphers/utils';


const modalStore = getModalStore();
const toastStore = getToastStore();

let nsec = '';
let showing = false;

async function clearCache() {
    let clearCacheResponse = async function(r: boolean){
        if (r) {
            try {
                await Dexie.delete('satshoot-db');
                // Must reload to open a brand new DB
                const t: ToastSettings = {
                    message: '\
                                <p class="text-center">Cache cleared!</p>\
                                <p>Refreshing page in 4 seconds...</p>\
                    ',
                    timeout: 4000,
                    background: 'bg-primary-300-600-token',
                };
                setTimeout(
                    ()=>{window.location.reload();},
                    4000,
                );
                
                $ndk.cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'satshoot-db' });

                toastStore.trigger(t);
            } catch (e) {
                const t: ToastSettings = {
                    message: 'Could not clear cache: ' + e,
                    timeout: 7000,
                    background: 'bg-error-300-600-token',
                };
                toastStore.trigger(t);
            }
        }
    }

    const modal: ModalSettings = {
        type: 'confirm',
        title: `<p class='text-center'>Clear local Cache?</p>`,
        body: `
            <p>
                This can solve some data loading problems but will slow down App
                until cache is filled again
            </p>
        `,
        response: clearCacheResponse,
    };
    modalStore.trigger(modal);
}

function showPrivateKey() {
    showing = !showing;
    if ($sessionPK) {
        nsec = nsecEncode(hexToBytes($sessionPK));
    }
}

let copiedNsec = false;
function onCopyNsec(): void {
    copiedNsec = true;
    setTimeout(() => {
        copiedNsec = false;
    }, 1000);
}

onDestroy(() => {
    nsec = '';
});

</script>

<div class="flex flex-col items-center gap-y-4 my-4">
    <button 
        class="btn bg-primary-300-600-token"
        type="button"
        on:click={ clearCache }
    >
        Clear Cache
    </button>

    {#if $sessionPK}
        <button
            class="btn bg-primary-300-600-token"
            type="button"
            on:click={ showPrivateKey }
        >
            Show Private key (nsec)
        </button>
        {#if nsec && showing}
            <div class="flex flex-col items-center gap-y-4">
                <div class="font-bold">
                    {
                        nsec.substring(0,10)
                        + '...'
                        + nsec.substring(nsec.length - 11, nsec.length - 1)
                    }
                </div>
            <button
                class="btn text-sm btn-sm bg-red-500 font-bold"
                use:clipboard={nsec}
                on:click={onCopyNsec}
            >
                {copiedNsec ? 'Copied!' : 'Dangerously Copy'}
            </button>
            </div>
        {/if}
    {/if}

    <div class="flex justify-start gap-x-2 items-center">
        <LightSwitch />
        <span>Theme</span>
    </div>

</div>
