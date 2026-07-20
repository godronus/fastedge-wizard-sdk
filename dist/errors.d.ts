import type { ErrorCode } from './protocol.js';
export declare class WizardError extends Error {
    readonly code: ErrorCode;
    constructor(code: ErrorCode, message: string);
}
//# sourceMappingURL=errors.d.ts.map