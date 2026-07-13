/**
 * Parity test — asserts that the guest SDK and host protocol copies are
 * byte-identical in every shared constant, so a one-sided edit fails loudly
 * instead of silently producing a broken runtime.
 *
 * Also walks a fake WizardSessionImpl to verify the SDK exposes a method for
 * every entry in INTENT_NAMES, so a newly-listed intent can't be left unwired.
 */
import { describe, it, expect } from 'vitest';

import * as sdk from './protocol';
import * as host from '../../libs/features/src/lib/wizard-host/models/wizard-protocol';
import { WizardSessionImpl } from './sdk';

// ---------------------------------------------------------------------------
// 1. Numeric protocol constants
// ---------------------------------------------------------------------------

describe('protocol constants parity (sdk ↔ host)', () => {
    it('WIZARD_PROTOCOL_VERSION matches', () => {
        expect(sdk.WIZARD_PROTOCOL_VERSION).toBe(host.WIZARD_PROTOCOL_VERSION);
    });

    it('MAX_MESSAGE_BYTES matches', () => {
        expect(sdk.MAX_MESSAGE_BYTES).toBe(host.MAX_MESSAGE_BYTES);
    });

    it('HANDSHAKE_TIMEOUT_MS matches', () => {
        expect(sdk.HANDSHAKE_TIMEOUT_MS).toBe(host.HANDSHAKE_TIMEOUT_MS);
    });

    it('INTENT_TIMEOUT_MS matches', () => {
        expect(sdk.INTENT_TIMEOUT_MS).toBe(host.INTENT_TIMEOUT_MS);
    });

    it('MAX_INFLIGHT_INTENTS matches', () => {
        expect(sdk.MAX_INFLIGHT_INTENTS).toBe(host.MAX_INFLIGHT_INTENTS);
    });

    it('RATE_LIMIT_WINDOW_MS matches', () => {
        expect(sdk.RATE_LIMIT_WINDOW_MS).toBe(host.RATE_LIMIT_WINDOW_MS);
    });

    it('RATE_LIMIT_MAX matches', () => {
        expect(sdk.RATE_LIMIT_MAX).toBe(host.RATE_LIMIT_MAX);
    });
});

// ---------------------------------------------------------------------------
// 2. ERROR_CODES — same order, same members
// ---------------------------------------------------------------------------

describe('ERROR_CODES parity', () => {
    it('arrays are identical (order + members)', () => {
        expect(Array.from(sdk.ERROR_CODES)).toStrictEqual(Array.from(host.ERROR_CODES));
    });
});

// ---------------------------------------------------------------------------
// 3. INTENT_NAMES — same order, same members
// ---------------------------------------------------------------------------

describe('INTENT_NAMES parity', () => {
    it('arrays are identical (order + members)', () => {
        expect(Array.from(sdk.INTENT_NAMES)).toStrictEqual(Array.from(host.INTENT_NAMES));
    });
});

// ---------------------------------------------------------------------------
// 4. SDK session exposes a method for every INTENT_NAMES entry
//
// Creates a minimal fake port so WizardSessionImpl can be instantiated without
// a handshake. Checks that every dot-path in INTENT_NAMES resolves to a
// function on the session object — so listing a new intent without wiring it
// causes this test to fail, not Phase 4 runtime behaviour.
// ---------------------------------------------------------------------------

describe('SDK session method coverage', () => {
    function createFakePort() {
        return {
            onmessage: null as ((event: { data: unknown }) => void) | null,
            postMessage: () => {},
            close: () => {},
            start: () => {},
        } as unknown as MessagePort;
    }

    it('session has a callable method for every INTENT_NAMES entry', () => {
        const session = new WizardSessionImpl(createFakePort());

        for (const intentName of sdk.INTENT_NAMES) {
            const parts = intentName.split('.');
            const obj = session as unknown as Record<string, unknown>;

            if (parts.length === 3) {
                // e.g. fastedge.templates.list → session.fastedge.templates.list
                const [ns, subgroup, method] = parts;
                const nsObj = obj[ns] as Record<string, unknown>;
                expect(nsObj, `namespace "${ns}" missing on session (intent: "${intentName}")`).toBeTruthy();
                const subObj = nsObj[subgroup] as Record<string, unknown>;
                expect(
                    subObj,
                    `subgroup "${ns}.${subgroup}" missing on session (intent: "${intentName}")`,
                ).toBeTruthy();
                expect(typeof subObj[method], `method "${intentName}" is not a function on session`).toBe('function');
            } else {
                // e.g. context.get, deployment.plan → session.context.get
                const [group, method] = parts;
                const groupObj = obj[group] as Record<string, unknown>;
                expect(groupObj, `group "${group}" missing on session (intent: "${intentName}")`).toBeTruthy();
                expect(typeof groupObj[method], `method "${intentName}" is not a function on session`).toBe('function');
            }
        }
    });
});
