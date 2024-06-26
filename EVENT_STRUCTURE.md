# Structure of app-specific events used in Bitcoin Troubleshoot


## Ticket event
```json
{
    "id": <32-bytes lowercase hex-encoded sha256 of the serialized event data>,
    "pubkey": <hex public key of the Bitcoiner>,
    "created_at": <unix timestamp in seconds>,
    "kind": 32767,
    "tags": [
        // A title for the ticket | string, mandatory
        ["title", <title string>]

        // Update/Replacement is based on this. Allows for multiple replaceable tickets
        ["d", <ticket ID | integer, mandatory>],

        // Allows for indexing/filtering | string, optional
        ["t", <tag1>],
        ["t", <tag2>],
                ...
        ["t", <tagN>],

        // Public key of preferred troubleshooters. Allows for more fine-tuned discovery | optional
        ["p", <hex public key1>],
        ["p", <hex public key2>],
                ...
        ["p", <hex public keyN>],

        // This could be replaced by a NIP65 Relay List?
        // Relays the Bitcoiner writes Tickets  
        ["r", "wss://...", write],
        ["r", "wss://...", write],
        ["r", "wss://...", write],
        ["r", "wss://...", write],
                ...

        // Relays where the Bitcoiner is expecting offers | optional
        ["r", "wss://...", read],
        ["r", "wss://...", read],
        ["r", "wss://...", read],
        ["r", "wss://...", read],
                ... 

        // Relays the Bitcoiner reads AND writes Tickets  
        ["r", "wss://..."],
        ["r", "wss://..."],
        ["r", "wss://..."],
        ["r", "wss://..."],
                ...

        // Preferred languages of the Bitcoiner | string, optional
        ["languages",<language1>, <language2>, ..., <languageN>],

        // Milestones if the Bitcoiner wants to define multiple steps for the ticket | string, optional
        ["milestones", <milestone1>, <milestone2>, ...,<milestoneN> ],

        ["s", <0(new) OR 1(in progress) OR 2(closed)>],

        // If Bitcoiner accepts an offer she SHOULD set this tag
        ["a", 32768:<hex pubkey of Troubleshooter>:<Offer ID from a d-tag of an offer>],
    ],
    "content": {
        <detailed description of the ticket | string, mandatory>
    },
    "sig": <64-bytes lowercase hex of the signature of the sha256 hash of the serialized event data, which is the same as the "id" field>
}
```

## Offer event
```json
{
    "id": <32-bytes lowercase hex-encoded sha256 of the serialized event data>,
    "pubkey": <hex public key of the Troubleshooter>,
    "created_at": <unix timestamp in seconds>,
    "kind": 32768,
    "tags": [
        // Replacement is based on this. Allows for multiple updatable/replaceable offers
        ["d", <offer ID, integer, mandatory>],
        ["a", 32767:<hex pubkey of Bitcoiner>:<ticket ID from a d-tag of a ticket>, mandatory>],
        ["pricing", <pricing strategy, MUST be either 0(absolute price), 1(sats/minute) or 2(sats/milestone), integer, mandatory>],
        // Amount of the price. If more than 1 amount, then it refers to the milestones of the ticket respectively. Else refers to the sats/minute or absolute price | mandatory
        ["amount", [<amount1>, <amount2>, ..., amountN>]]
    ],
    "content": {
        <Cover letter for the offer, string, optional>, 
    },
    "sig": <64-bytes lowercase hex of the signature of the sha256 hash of the serialized event data, which is the same as the "id" field>
}
```
