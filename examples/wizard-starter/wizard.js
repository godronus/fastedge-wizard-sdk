import { connect, WizardError } from '@gcore/fastedge-wizard-sdk';

// The proxy appends ?hostOrigin=<portal-origin> to the iframe src — read it, never hardcode.
const hostOrigin = new URLSearchParams(location.search).get('hostOrigin');
const main = document.querySelector('main');

try {
    const session = await connect({ expectedHostOrigin: hostOrigin });
    // SDK has already applied body.gc-theme-* and documentElement.lang from HELLO.
    await session.context.get();
    main.hidden = false; // reveal only after theme is set to avoid flash of unthemed content

    document.querySelector('[data-action=submit]').addEventListener('click', async () => {
        try {
            await session.fastedge.apps.create({
                /* TODO: fill in name, api_type, source, env */
            });
        } catch (err) {
            if (!(err instanceof WizardError && err.code === 'user_cancelled')) throw err;
        }
    });
} catch (err) {
    // Handshake failed — 10 s timeout or unexpected origin.
    console.error(err);
}
