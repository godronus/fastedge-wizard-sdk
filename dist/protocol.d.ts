/**
 * Wire protocol constants and message shapes — doc 05 (bridge protocol), verbatim.
 * This file is the single source of truth on the guest side; the host keeps an
 * independent copy (per doc 07) since the two packages do not share a build.
 */
export declare const WIZARD_PROTOCOL_VERSION = 1;
export declare const MAX_MESSAGE_BYTES: number;
export declare const HANDSHAKE_TIMEOUT_MS = 10000;
export declare const INTENT_TIMEOUT_MS = 60000;
export declare const MAX_INFLIGHT_INTENTS = 8;
export declare const RATE_LIMIT_WINDOW_MS = 10000;
export declare const RATE_LIMIT_MAX = 20;
export declare const ERROR_CODES: readonly ["denied", "out_of_scope", "invalid_params", "user_cancelled", "unauthorized", "not_found", "conflict", "upstream_error", "rate_limited", "timeout", "protocol_error"];
export type ErrorCode = (typeof ERROR_CODES)[number];
export declare const INTENT_NAMES: readonly ["context.get", "fastedge.templates.list", "fastedge.templates.read", "fastedge.apps.list", "fastedge.apps.get", "fastedge.apps.create", "fastedge.apps.update", "fastedge.apps.link", "fastedge.secrets.list", "fastedge.secrets.create", "fastedge.secrets.pick", "deployment.plan", "deployment.apply"];
export type IntentName = (typeof INTENT_NAMES)[number];
/** 1. host → guest, over window.postMessage (NOT the port), transferring port2. */
export interface InitMessage {
    v: number;
    type: 'init';
}
/** 2. host → guest, over the port. Announces protocol version and host context. */
export interface HelloMessage {
    v: number;
    type: 'hello';
    hostContext: {
        specVersion: string;
        theme: 'light' | 'dark';
        locale: string;
    };
}
/** 3. guest → host, over the port. Confirms the guest is ready. */
export interface ReadyMessage {
    v: number;
    type: 'ready';
    sdkVersion: string;
}
/** guest → host */
export interface IntentMessage {
    v: number;
    type: 'intent';
    id: string;
    intent: string;
    params: unknown;
}
/** host → guest — exactly one per IntentMessage.id */
export interface ResultMessage {
    v: number;
    type: 'result';
    id: string;
    ok: boolean;
    data?: unknown;
    error?: {
        code: ErrorCode;
        message: string;
    };
}
/** host → guest — unsolicited (progress, cancellation, host state changes) */
export interface EventMessage {
    v: number;
    type: 'event';
    event: string;
    payload?: unknown;
}
export type WizardMessage = InitMessage | HelloMessage | ReadyMessage | IntentMessage | ResultMessage | EventMessage;
//# sourceMappingURL=protocol.d.ts.map