/**
 * Wire protocol constants and message shapes — doc 05 (bridge protocol), verbatim.
 * This file is the single source of truth on the guest side; the host keeps an
 * independent copy (per doc 07) since the two packages do not share a build.
 */
export const WIZARD_PROTOCOL_VERSION = 1;
export const MAX_MESSAGE_BYTES = 64 * 1024; // reject larger inbound messages
export const HANDSHAKE_TIMEOUT_MS = 10000; // INIT→READY must complete within this
export const INTENT_TIMEOUT_MS = 60000; // host-side per-intent budget
export const MAX_INFLIGHT_INTENTS = 8; // per wizard instance
export const RATE_LIMIT_WINDOW_MS = 10000;
export const RATE_LIMIT_MAX = 20; // intents per window (sliding)
// Every doc-05 error code as a runtime array — enables parity testing and exhaustive checks.
export const ERROR_CODES = [
    'denied',
    'out_of_scope',
    'invalid_params',
    'user_cancelled',
    'unauthorized',
    'not_found',
    'conflict',
    'upstream_error',
    'rate_limited',
    'timeout',
    'protocol_error',
];
// Every doc-04 intent name, in catalog order. Single enumerable list both sides share.
// context.get and deployment.* are host primitives — no api prefix (doc 04 v2 naming).
export const INTENT_NAMES = [
    'context.get',
    'fastedge.templates.list',
    'fastedge.templates.read',
    'fastedge.apps.list',
    'fastedge.apps.get',
    'fastedge.apps.create',
    'fastedge.apps.update',
    'fastedge.apps.link',
    'fastedge.secrets.list',
    'fastedge.secrets.create',
    'fastedge.secrets.pick',
    'deployment.plan',
    'deployment.apply',
];
//# sourceMappingURL=protocol.js.map