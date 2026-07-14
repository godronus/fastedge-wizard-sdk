export class WizardError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'WizardError';
        this.code = code;
    }
}
//# sourceMappingURL=errors.js.map