# Wizard Starter

Correct-by-default skeleton for a FastEdge wizard. Edit `wizard.js` and `styles.css`; don't touch `index.html` unless you need extra screens.

## Before you start

Fill in the `<WIZARD_CDN>` placeholder in `index.html` with the confirmed token CDN path. See [`docs/wizards/styling/01-design-tokens.md`](../../../../docs/wizards/styling/01-design-tokens.md).

## Preview locally

Follow [`docs/wizards/local-dev.md`](../../../../docs/wizards/local-dev.md).

## What you get for free

- Light/dark theme applied to `<body>` automatically on handshake (SDK sets `gc-theme-light` / `gc-theme-dark`).
- Live re-theme on portal toggle via `theme.changed` event — no wizard code needed.
- `document.documentElement.lang` set to the portal's current locale.

## Rules

- `styles.css` must use only `var(--gc-*)` tokens — the CI stylelint gate rejects raw colour literals.
- Handle `WizardError` with `code === 'user_cancelled'` as a normal UI state, not an error.
