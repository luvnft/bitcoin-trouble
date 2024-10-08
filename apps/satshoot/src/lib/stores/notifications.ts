// import ndk from "./ndk";
import { persisted } from "svelte-persisted-store";
import type { Writable } from 'svelte/store';
import { derived, writable } from "svelte/store";
import { getSetSerializer } from '$lib//utils/misc';
import { get } from "svelte/store";
import { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { TicketEvent } from "$lib/events/TicketEvent";
import { OfferEvent } from "$lib/events/OfferEvent";
import { ReviewEvent } from "$lib/events/ReviewEvent";
import currentUser from "./user";

import { getActiveServiceWorker } from "$lib/utils/helpers";
import { goto } from "$app/navigation";
import { troubleshootZap } from "../utils/helpers.ts";

export const notificationsEnabled: Writable<boolean> = persisted('notificationsEnabled', false) ;

export const seenIDs: Writable<Set<string>> = persisted(
    'seenIDs',
    new Set(),
    {serializer: getSetSerializer()}
);

export const notifications = writable<NDKEvent[]>([]);

export const ticketNotifications = derived(
    [notifications],
    ([$notifications]) => {

        const filteredEvents = $notifications.filter((notification: NDKEvent) => {
            return notification.kind === NDKKind.TroubleshootTicket;
        });

        const tickets: TicketEvent[] = [];
        filteredEvents.forEach((t: NDKEvent)=>{tickets.push(TicketEvent.from(t))});

        return tickets;
    }
);

export const offerNotifications = derived(
    [notifications],
    ([$notifications]) => {

        const filteredEvents = $notifications.filter((notification: NDKEvent) => {
            return notification.kind === NDKKind.TroubleshootOffer;
        });

        const offers: OfferEvent[] = [];
        filteredEvents.forEach((o: NDKEvent)=>{offers.push(OfferEvent.from(o))});

        return offers;
    }
);

export const messageNotifications = derived(
    [notifications, currentUser],
    ([$notifications, $currentUser]) => {

        let messages: NDKEvent[] = [];
        if ($currentUser) {
            messages = $notifications.filter((notification: NDKEvent) => {
                const dmKind = (notification.kind === NDKKind.EncryptedDirectMessage);
                const notSentByUser = (notification.pubkey !== $currentUser.pubkey);
                return dmKind && notSentByUser;
            });
        }

        return messages;
    }
);

export const reviewNotifications = derived(
    [notifications],
    ([$notifications]) => {

        const filteredEvents = $notifications.filter((notification: NDKEvent) => {
            return notification.kind === NDKKind.Review;
        });

        const reviews: ReviewEvent[] = [];
        filteredEvents.forEach((r: NDKEvent)=>{reviews.push(ReviewEvent.from(r))});

        return reviews;
    }
);

export const receivedZapsNotifications = derived(
    [notifications],
    ([$notifications]) => {
        // Check for zap kinds and if zap has an 'a' tag referring to an Offer
        const filteredEvents = $notifications.filter((notification: NDKEvent) => {
            return troubleshootZap(notification);
        });

        return filteredEvents;
    }
);

export async function sendNotification(event: NDKEvent) {
    const $seenIDs = get(seenIDs);
    const $notifications = get(notifications);
    if(get(notificationsEnabled) 
        && !$seenIDs.has(event.id)
    ) {
        $seenIDs.add(event.id);
        seenIDs.set($seenIDs);
        $notifications.push(event);
        notifications.set($notifications);

        let title = '';
        let body = '';
        let tag = '';
        const icon = '/satshoot.svg'

        // The Ticket of our _Offer_ was updated
        if (event.kind === NDKKind.TroubleshootTicket) {
            title = 'Update!';
            body = '🔔 Check your Notifications!';
            tag = NDKKind.TroubleshootTicket.toString();
            // The Offer on our _Ticket_ was updated
        } else if(event.kind === NDKKind.TroubleshootOffer) {
            title = 'Update!';
            body = '🔔 Check your Notifications!';
            tag = NDKKind.TroubleshootOffer.toString();
        } else if (event.kind === NDKKind.EncryptedDirectMessage) {
            title = 'New Message!';
            body = '🔔 Check your Notifications!';
            tag = NDKKind.EncryptedDirectMessage.toString();
        } else if (event.kind === NDKKind.Review) {
            title = 'Someone left a Review!';
            body = '🔔 Check your Notifications!';
            tag = NDKKind.Review.toString();
        } else if (event.kind === NDKKind.Zap) {
            title = 'Payment arrived!';
            body = '🔔 Check your Notifications!';
            tag = NDKKind.Zap.toString();
        }

        const activeSW = await getActiveServiceWorker()
        if(activeSW) {
            activeSW.postMessage({
                notification: 'true',
                title: title,
                body: body,
                tag: tag,
            });
        } else {
            const options = {
                icon: icon,
                badge: icon,
                image: icon,
                body: body,
                tag: tag,
            };
            const notification = new Notification(title, options);
            notification.onclick = (e) => {
                goto('/notifications/');
            };
        }

    }
}

export default notificationsEnabled;
