<script lang="ts">
    import ndk from "$lib/stores/ndk";
    import { TicketEvent, TicketStatus } from '$lib/events/TicketEvent';

    import { getToastStore } from '@skeletonlabs/skeleton';
    import { getModalStore } from '@skeletonlabs/skeleton';
    import type { ToastSettings, ModalSettings } from '@skeletonlabs/skeleton';
    import { ProgressRadial } from '@skeletonlabs/skeleton';
    import { type SvelteComponent, tick } from "svelte";
    import { newTickets } from "$lib/stores/troubleshoot-eventstores";

    const toastStore = getToastStore();
    const modalStore = getModalStore();

    /** Exposes parent props to this component. */
    export let parent: SvelteComponent;
    export let ticket: TicketEvent;

    let closing = false;

    async function closeTicket() {
        if (ticket) {
            let ticketToPublish = new TicketEvent($ndk);
            ticketToPublish.tags = ticket.tags;
            ticketToPublish.description = ticket.description;
            // Important part! This also sets status to in progress
            ticketToPublish.status = TicketStatus.Closed;

            try {
                closing = true;
                await tick();

                await ticketToPublish.publish();

                const indexOfClosedTicket = $newTickets.indexOf(ticket);
                $newTickets.splice(indexOfClosedTicket, 1);

                modalStore.close();

                // Ticket posted Modal
                const modal: ModalSettings = {
                    type: 'alert',
                    title: 'Ticket Closed!',
                    body: `
                        <p class='mb-4'>You Closed the Ticket! Hope your issue was resolved!</p>
                        <p>
                        You will find this Ticket in 'My Tickets' under the 'Closed' tab!
                        </p>
                        `,
                    buttonTextCancel:'Ok',
                };
                modalStore.trigger(modal);
            } catch(e) {
                console.log(e)
                const t: ToastSettings = {
                    message: 'Error while closing Ticket! Fix connection with Relays and try again!',
                    timeout: 7000,
                    background: 'bg-error-300-600-token',
                };
                toastStore.trigger(t);
                modalStore.close();
            }
        } else {
            closing = false;
            const t: ToastSettings = {
                message: 'Error: Could could not find ticket to close!',
                timeout: 7000,
                background: 'bg-error-300-600-token',
            };
            toastStore.trigger(t);
        }
    }

</script>

{#if $modalStore[0]}
    {#if ticket}
        <div class="card p-4">
            <h4 class="h4 text-center mb-2">{'Close Ticket'}</h4>
            <div class="flex flex-col justify-center gap-y-4">
                <div class="text-center font-bold">
                    Do really want to Close this Ticket?
                </div>
                <div class="grid grid-cols-[30%_1fr] gap-x-2">
                    <button 
                        type="button"
                        class="btn btn-sm sm:btn-md bg-error-300-600-token"
                        on:click={()=> modalStore.close()}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        on:click={closeTicket}
                        class="btn btn-sm sm:btn-md bg-tertiary-300-600-token"
                        disabled={closing}
                    >
                        {#if closing}
                            <span>
                                <ProgressRadial value={undefined} stroke={60} meter="stroke-error-500"
                                    track="stroke-error-500/30" strokeLinecap="round" width="w-8" />
                            </span>
                        {:else}
                            <span>Close</span>
                        {/if}

                    </button>
                </div>
            </div>
        </div>
    {:else}
        <h2 class="h2 font-bold text-center text-error-300-600-token">
            Error: Ticket is missing!
        </h2>
    {/if}
{/if}
