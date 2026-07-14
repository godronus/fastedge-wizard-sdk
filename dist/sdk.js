import { WIZARD_PROTOCOL_VERSION, HANDSHAKE_TIMEOUT_MS, INTENT_TIMEOUT_MS, } from './protocol.js';
import { WizardError } from './errors.js';
export const SDK_VERSION = '0.1.0';
function applyTheme(theme) {
    if (typeof document === 'undefined')
        return;
    document.body.classList.remove('gc-theme-light', 'gc-theme-dark');
    document.body.classList.add(`gc-theme-${theme}`);
}
// Client-side intent timeout is slightly longer than the host's INTENT_TIMEOUT_MS
// (doc 06) so the host's own timeout error always wins the race.
const CLIENT_INTENT_TIMEOUT_MS = INTENT_TIMEOUT_MS + 30000;
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
// Exported for use by the parity test — not part of the public index API.
export class WizardSessionImpl {
    constructor(port) {
        this.pending = new Map();
        this.eventHandlers = new Map();
        this.nextId = 0;
        this.disposed = false;
        this.port = port;
        this.context = { get: () => this.invoke('context.get', {}) };
        this.fastedge = {
            templates: {
                list: (params) => this.invoke('fastedge.templates.list', params ?? {}),
                read: (params) => this.invoke('fastedge.templates.read', params),
            },
            apps: {
                list: () => this.invoke('fastedge.apps.list', {}),
                get: (params) => this.invoke('fastedge.apps.get', params),
                create: (params) => this.invoke('fastedge.apps.create', params),
                update: (params) => this.invoke('fastedge.apps.update', params),
                link: (params) => this.invoke('fastedge.apps.link', params),
            },
            secrets: {
                list: () => this.invoke('fastedge.secrets.list', {}),
                create: (params) => this.invoke('fastedge.secrets.create', params),
                pick: () => this.invoke('fastedge.secrets.pick', {}),
            },
        };
        this.deployment = {
            plan: (params) => this.invoke('deployment.plan', params),
            apply: (params) => this.invoke('deployment.apply', params),
        };
        this.port.onmessage = (event) => this.handlePortMessage(event);
        // Auto-apply theme on live toggle — no wizard code needed.
        this.on('theme.changed', (p) => {
            const payload = p;
            applyTheme(payload.theme);
        });
    }
    handlePortMessage(event) {
        const data = event.data;
        if (!isRecord(data) || data['v'] !== WIZARD_PROTOCOL_VERSION)
            return;
        if (data['type'] === 'result') {
            this.handleResult(data);
        }
        else if (data['type'] === 'event') {
            this.handleEvent(data);
        }
        // Anything else (init/hello/ready) is not expected post-handshake — ignore.
    }
    handleResult(msg) {
        const pending = this.pending.get(msg.id);
        if (!pending)
            return; // unknown id, or a second result for an already-settled id — drop
        this.pending.delete(msg.id);
        clearTimeout(pending.timer);
        if (msg.ok) {
            pending.resolve(msg.data);
        }
        else {
            const err = msg.error ?? { code: 'upstream_error', message: 'Unknown error' };
            pending.reject(new WizardError(err.code, err.message));
        }
    }
    handleEvent(msg) {
        const handlers = this.eventHandlers.get(msg.event);
        if (!handlers)
            return;
        for (const handler of handlers)
            handler(msg.payload);
    }
    invoke(intent, params) {
        if (this.disposed) {
            return Promise.reject(new WizardError('protocol_error', 'Session is disposed'));
        }
        const id = `req-${this.nextId++}`;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new WizardError('timeout', `Intent "${intent}" timed out`));
            }, CLIENT_INTENT_TIMEOUT_MS);
            this.pending.set(id, { resolve: resolve, reject, timer });
            const message = { v: WIZARD_PROTOCOL_VERSION, type: 'intent', id, intent, params };
            this.port.postMessage(message);
        });
    }
    on(event, handler) {
        let handlers = this.eventHandlers.get(event);
        if (!handlers) {
            handlers = new Set();
            this.eventHandlers.set(event, handlers);
        }
        handlers.add(handler);
        return () => handlers?.delete(handler);
    }
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const pending of this.pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(new WizardError('protocol_error', 'Session disposed'));
        }
        this.pending.clear();
        this.eventHandlers.clear();
        this.port.onmessage = null;
        this.port.close();
    }
}
/** Perform the handshake (doc 05, guest side) and resolve once READY is sent. */
export function connect(options) {
    const { expectedHostOrigin, handshakeTimeoutMs = HANDSHAKE_TIMEOUT_MS } = options;
    return new Promise((resolve, reject) => {
        let settled = false;
        let port;
        const timeoutTimer = setTimeout(() => {
            finish(() => reject(new WizardError('timeout', 'Handshake did not complete in time')));
        }, handshakeTimeoutMs);
        function finish(fn) {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeoutTimer);
            window.removeEventListener('message', onWindowMessage);
            fn();
        }
        function onWindowMessage(event) {
            if (settled)
                return;
            // Only the parent frame may deliver the capability — never a sibling frame.
            if (event.source !== window.parent)
                return;
            // The host is not sandboxed, so it has a real, checkable origin (doc 05).
            if (event.origin !== expectedHostOrigin)
                return;
            const data = event.data;
            if (!isRecord(data) || data['type'] !== 'init')
                return;
            if (data['v'] !== WIZARD_PROTOCOL_VERSION) {
                finish(() => reject(new WizardError('protocol_error', `Protocol version mismatch: host=${String(data['v'])}, sdk=${WIZARD_PROTOCOL_VERSION}`)));
                return;
            }
            const capturedPort = event.ports.length === 1 ? event.ports[0] : undefined;
            if (!capturedPort)
                return;
            port = capturedPort;
            capturedPort.onmessage = onPortMessage;
            capturedPort.start();
        }
        function onPortMessage(event) {
            if (settled)
                return;
            const data = event.data;
            if (!isRecord(data) || data['type'] !== 'hello')
                return;
            if (data['v'] !== WIZARD_PROTOCOL_VERSION) {
                finish(() => reject(new WizardError('protocol_error', `Protocol version mismatch: host=${String(data['v'])}, sdk=${WIZARD_PROTOCOL_VERSION}`)));
                return;
            }
            const hello = data;
            applyTheme(hello.hostContext.theme ?? 'light');
            if (typeof document !== 'undefined') {
                document.documentElement.lang = hello.hostContext.locale ?? 'en';
            }
            const ready = { v: WIZARD_PROTOCOL_VERSION, type: 'ready', sdkVersion: SDK_VERSION };
            port.postMessage(ready);
            finish(() => resolve(new WizardSessionImpl(port)));
        }
        window.addEventListener('message', onWindowMessage);
    });
}
//# sourceMappingURL=sdk.js.map