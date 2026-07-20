import type { WizardContext, TemplateSummary, TemplateDetail, TemplatesListParams, AppSummary, AppDetail, AppCreateParams, AppCreateResult, AppUpdateParams, AppUpdateResult, AppLinkParams, AppLinkResult, SecretSummary, SecretCreateParams, SecretRef, DeploymentPlanParams, DeploymentPlan, DeploymentApplyResult } from './types.js';
export declare const SDK_VERSION = "0.1.0";
export interface WizardSdkOptions {
    /** Exact origin of the FastEdge portal that is allowed to host this wizard.
     *  The SDK rejects INIT from any other origin (doc 05, guest step 2). Required. */
    expectedHostOrigin: string;
    /** Optional: override handshake timeout (default from doc 05). */
    handshakeTimeoutMs?: number;
}
export interface WizardSession {
    context: {
        get(): Promise<WizardContext>;
    };
    fastedge: {
        templates: {
            list(params?: TemplatesListParams): Promise<TemplateSummary[]>;
            read(params: {
                id: number;
            }): Promise<TemplateDetail>;
        };
        apps: {
            list(): Promise<AppSummary[]>;
            get(params: {
                id: number;
            }): Promise<AppDetail>;
            create(params: AppCreateParams): Promise<AppCreateResult>;
            update(params: AppUpdateParams): Promise<AppUpdateResult>;
            link(params: AppLinkParams): Promise<AppLinkResult>;
        };
        secrets: {
            list(): Promise<SecretSummary[]>;
            create(params: SecretCreateParams): Promise<SecretRef>;
            /** Opens the host's secret picker so the user chooses existing secret(s); only the
             *  selected { id, name } refs cross the bridge (the guest never enumerates the account). */
            pick(): Promise<SecretRef[]>;
        };
    };
    deployment: {
        plan(params: DeploymentPlanParams): Promise<DeploymentPlan>;
        apply(params: {
            planId: string;
        }): Promise<DeploymentApplyResult>;
    };
    /** Subscribe to host-pushed events (doc 05 EventMessage). Returns an unsubscribe fn. */
    on(event: string, handler: (payload: unknown) => void): () => void;
    /** Close the port and detach listeners. */
    dispose(): void;
}
export declare class WizardSessionImpl implements WizardSession {
    readonly context: WizardSession['context'];
    readonly fastedge: WizardSession['fastedge'];
    readonly deployment: WizardSession['deployment'];
    private readonly port;
    private readonly pending;
    private readonly eventHandlers;
    private nextId;
    private disposed;
    constructor(port: MessagePort);
    private handlePortMessage;
    private handleResult;
    private handleEvent;
    private invoke;
    on(event: string, handler: (payload: unknown) => void): () => void;
    dispose(): void;
}
/** Perform the handshake (doc 05, guest side) and resolve once READY is sent. */
export declare function connect(options: WizardSdkOptions): Promise<WizardSession>;
//# sourceMappingURL=sdk.d.ts.map