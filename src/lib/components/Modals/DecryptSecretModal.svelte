<script lang="ts">
    import { type SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';

    import { tick } from 'svelte';

    import { DataLoadError } from '$lib/utils/errors';

    import { RestoreMethod } from "$lib/stores/ndk";

	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();

    let passphrase:string;
    let statusMessage: string;
    let statusColor = 'text-tertiary-200-700-token';

    let decrypting = false;

    async function loadSecret() {
        decrypting = true;
        await tick();

        statusColor = 'text-tertiary-200-700-token';
        statusMessage = 'Decrypting...';
        try {
            let restoreMethod: RestoreMethod|undefined = undefined;
            const encryptedSeed: string|null = localStorage.getItem("nostr-seedwords");
            const encryptedNsec: string|null = localStorage.getItem("nostr-nsec");
            const salt :string|null = localStorage.getItem("nostr-npub");

            // Restore method depends on the local storage key(nostr-seedwords/nsec)
            if (encryptedSeed) {
                restoreMethod = RestoreMethod.Seed;
            } else if (encryptedNsec) {
                restoreMethod = RestoreMethod.Nsec;
            }

            if (!encryptedSeed && !encryptedNsec) {
                throw new DataLoadError('Could not fetch encrypted secret from local storage!', 'tried: nostr-seedwords, nostr-nsec');
            }
            if (!salt) {
                throw new DataLoadError('Could not fetch npub from local storage! Npub necessary for decryption!', 'nostr-npub');
            }

            const cryptWorker = new Worker(new URL("$lib/utils/crypto.worker.ts", import.meta.url),{
                type: 'module'
            });

            cryptWorker.onmessage = (m) => {
                const decryptedSecret = m.data['decryptedSecret'];
                decrypting = false;
                if (decryptedSecret) {
                    if ($modalStore[0].response) {
                        $modalStore[0].response(
                            {
                                decryptedSecret: decryptedSecret,
                                restoreMethod: restoreMethod
                            }
                        );
                        modalStore.close();
                    };
                } else {
                    statusMessage = 'Unexpected response from decryption process:' + m.data;
                    setTimeout(()=>{
                        statusColor = 'text-red-500';
                    }, 800);            
                }
            };

            cryptWorker.onerror = (e) => {
                decrypting = false;
                console.log("Error happened in cryptWorker:", e.message)
                statusMessage = `Error while decrypting secret! Incorrect Passphrase!`;
                setTimeout(()=>{
                    statusColor = 'text-red-500';
                }, 800);            

            };

            cryptWorker.onmessageerror = (me) => {
                decrypting = false;
                console.log('Message error:', me);
                statusMessage = 'Received malformed message: ' + me.data;

                setTimeout(()=>{
                    statusColor = 'text-red-500';
                }, 800);            
            }
            
            // Start worker in background and wait for decryption result in onmessage
            cryptWorker.postMessage({
                encrpytedSecret: encryptedSeed ?? encryptedNsec,
                passphrase: passphrase,
                salt: salt
            });


        } catch(e) {
            decrypting = false;
            if (e instanceof DataLoadError) {
                const error = e as DataLoadError;
               statusMessage = error.message; 
            } else {
                statusMessage = 'Unkown Error happened:' + e;
            }
            setTimeout(()=>{
                statusColor = 'text-red-500';
            }, 800);            
 
        }
    }

    let showPassword: boolean = false;

</script>

{#if $modalStore[0]}
	<div class="card p-8 grid grid-cols-1 justify-center w-screen/2 h-screen-2 bg-surface-400-500-token">
        <h3 class="h3 text-center font-bold">Decrypt Local Seed</h3>
        <h4 class="h4 mt-2">Found Seed in browser local storage, provide passphrase to load it:</h4>
        <form 
            on:submit|preventDefault={ loadSecret }>
            <div class="flex justify-between items-center m-4">
                    <input 
                        class="input" 
                        title="Passphrase:" 
                        required
                        type={ showPassword ? 'text' : 'password' }
                        placeholder="Enter Passphrase..."
                        on:input={(event) => passphrase = event.currentTarget.value}
                    />
                    <button
                        type="button" 
                        class="btn btn-icon-sm"
                        on:click={ () => showPassword = !showPassword }>
                        <span>
                            <i class="fa-solid { showPassword ? 'fa-eye' : 'fa-eye-slash' }"></i>
                        </span>
                    </button>
            </div>
            <div class="flex justify-center">
                <button 
                    type="submit"
                    class="btn btn-lg h-14 font-bold bg-primary-400-500-token"
                    disabled={!passphrase || decrypting}
                >
                    Decrypt
                </button>
            </div>
        </form>
        {#if statusMessage}
            <h5 class="h5 font-bold text-center {statusColor} mt-2" >{statusMessage}</h5>
        {/if}
    </div>

{/if}