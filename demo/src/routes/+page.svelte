<script lang="ts">
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";
    import ReconnectingEventSource from "reconnecting-eventsource";

    // const pushPinUrl = "http://localhost:7999/api/pushpin/chat/general";
    const pushPinUrl = "http://localhost:3000/api/pushpin/chat/general";

    let sending = false;
    let input: HTMLInputElement | undefined;

    let messages: string[] = [];

    let events: ReconnectingEventSource | undefined;

    onMount(() => {
        events = new ReconnectingEventSource(pushPinUrl);

        events.addEventListener('message', async (event) => {
			try {
				const eventData = JSON.parse(event?.data);

                if(eventData?.text) {
                    messages = [...messages, eventData.text];
                }

                console.log('hello world');
                console.log('eventData', eventData);
			} catch (e) {
				console.warn('Malformed realtime message', e);
			}
		});

        return () => {
            events?.close();
        };
    });
</script>

<svelte:head>
    <title>Socket.IO chat</title>
</svelte:head>

<div>
    <ul id="messages">
        {#each messages as message}
            <li>{message}</li>
        {/each}
    </ul>
    <form
        id="form"
        method="POST"
        use:enhance={() => {
            sending = true;
            return ({ update }) => {
                update().finally(() => {
                    sending = false;
                    //input?.focus();
                });
            };
        }}
    >
        <!-- disabled={sending} -->
        <input
            bind:this={input}
            name="text"
            id="input"
            autocomplete="off"
            autofocus
        />
        <button disabled={sending}>Send</button>
    </form>
</div>

<style>
    div {
        margin: 0;
        padding-bottom: 3rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif;
    }

    #form {
        background: rgba(0, 0, 0, 0.15);
        padding: 0.25rem;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        height: 3rem;
        box-sizing: border-box;
        backdrop-filter: blur(10px);
    }
    #input {
        border: none;
        padding: 0 1rem;
        flex-grow: 1;
        border-radius: 2rem;
        margin: 0.25rem;
    }
    #input:focus {
        outline: none;
    }
    #form > button {
        background: #333;
        border: none;
        padding: 0 1rem;
        margin: 0.25rem;
        border-radius: 3px;
        outline: none;
        color: #fff;
    }

    /* disabled button */
    #form > button:disabled {
        background: #666;
    }

    #messages {
        list-style-type: none;
        margin: 0;
        padding: 0;
    }
    #messages > li {
        padding: 0.5rem 1rem;
    }
    #messages > li:nth-child(odd) {
        background: #efefef;
    }
</style>
