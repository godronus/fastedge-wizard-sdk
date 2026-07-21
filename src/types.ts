/**
 * Intent catalog shapes — all SDK-exposed namespaces fully typed.
 *
 * Mock host (`pnpm run dev`) simulates every intent across all namespaces —
 * `fastedge.*`, `cdn.*`, `stores.*`, `deployment.*` — using fixture data.
 * Build and test end-to-end locally without a live portal connection.
 *
 * Live portal status: `fastedge.templates.*` and `fastedge.apps.list/get` are
 * live. Write intents (`apps.create/update`, `secrets.*`, `deployment.*`) are
 * in progress; `cdn.*` and `stores.*` are pending host-side rollout.
 */

// --- context.get ---

export interface WizardContext {
    specVersion: string;
    locale: string;
    theme: 'light' | 'dark';
    wizardAppId: number;
    managed: { appIds: number[] };
    features: Record<string, boolean>;
}

// --- templates.* ---

export interface TemplateSummary {
    id: number;
    name: string;
    short_descr: string;
    long_descr: string;
    api_type: string;
}

export interface TemplateParam {
    name: string;
    data_type: 'string' | 'number' | 'bool' | 'date' | 'time' | 'secret' | 'store';
    descr: string;
    mandatory: boolean;
    metadata?: string;
}

export interface TemplateDetail {
    id: number;
    name: string;
    short_descr: string;
    long_descr: string;
    api_type: string;
    binary_id: number;
    params: TemplateParam[];
}

export interface TemplatesListParams {
    apiType?: 'wasi-http' | 'proxy-wasm';
}

// --- apps.* ---

export interface AppSummary {
    id: number;
    name: string;
    api_type: string;
    status: number;
    url?: string;
}

export interface AppDetail {
    id: number;
    name: string;
    api_type: string;
    status: number;
    url: string;
    template?: number | null;
    env: Record<string, string>;
    secrets: Array<{ name: string; id: number }>;
    rsp_headers?: Record<string, string>;
}

export interface AppCreateParams {
    name: string;
    api_type: 'wasi-http' | 'proxy-wasm';
    source: { fromTemplateId: number } | { binaryId: number };
    env?: Record<string, string>;
    secretRefs?: Record<string, number>;
    rsp_headers?: Record<string, string>;
    comment?: string;
    networks?: string[];
}

export interface AppCreateResult {
    id: number;
    url: string;
    status: number;
}

export interface AppUpdateParams {
    id: number;
    name?: string;
    comment?: string;
    env?: Record<string, string>;
    secretRefs?: Record<string, number>;
    rsp_headers?: Record<string, string>;
    networks?: string[];
}

export interface AppUpdateResult {
    id: number;
    status: number;
}

export interface AppLinkParams {
    appIds: number[];
    sharedEnv: Record<string, string>;
}

export interface AppLinkResult {
    updated: number[];
}

// --- secrets.* ---

export interface SecretSummary {
    id: number;
    name: string;
    app_count?: number;
    comment?: string;
}

export interface SecretCreateParams {
    name: string;
    comment?: string;
}

export interface SecretRef {
    id: number;
    name: string;
}

// --- stores.* ---

export interface KvStoreSummary {
    id: number;
    name: string;
    comment?: string;
}

export interface KvStoreRef {
    id: number;
    name: string;
}

export interface KvStoreCreateParams {
    name?: string;
    comment?: string;
}

export interface KvStoreCreateResult {
    id: number;
    name: string;
}

// --- secrets.generate / generateKeypair ---

export interface SecretGenerateParams {
    name: string;
    comment?: string;
    bytes: number;
}

export interface SecretGenerateResult {
    id: number;
    name: string;
}

export interface SecretGenerateKeypairParams {
    name: string;
    comment?: string;
    algorithm: 'ES256';
}

export interface SecretGenerateKeypairResult {
    id: number;
    name: string;
    publicKey: string;
}

// --- cdn.resources.* ---

export interface CdnResourceSummary {
    id: number;
    cname: string;
    description?: string;
    status: string;
}

export interface CdnResourcePickResult {
    id: number;
    cname: string;
}

// --- cdn.origins.* ---

export interface CdnOriginCreateParams {
    name: string;
    appId: number;
}

export interface CdnOriginCreateResult {
    id: number;
    name: string;
}

export interface CdnOriginSummary {
    id: number;
    name: string;
}

// --- cdn.rules.* ---

export interface CdnRuleCreateParams {
    resourceId: number;
    name: string;
    rule: string;
    weight?: number;
    originGroupId?: number;
    fastedgeFilter?: {
        appId: number;
        hook: 'on_request_headers' | 'on_response_headers';
        interruptOnError?: boolean;
    };
}

export interface CdnRuleCreateResult {
    id: number;
    name: string;
    rule: string;
}

export interface CdnRulesListParams {
    resourceId: number;
}

export interface CdnRuleSummary {
    id: number;
    name: string;
    rule: string;
    weight?: number;
    originGroupId?: number;
    fastedgeFilter?: {
        appId: number;
        hook: 'on_request_headers' | 'on_response_headers';
    };
}

// --- deployment.* ---

export interface DeploymentPlanApp {
    ref: string;
    name: string;
    api_type: 'wasi-http' | 'proxy-wasm';
    source: { fromTemplateId: number } | { binaryId: number };
    env?: Record<string, string>;
    secretRefs?: Record<string, number>;
}

export interface DeploymentPlanParams {
    apps: DeploymentPlanApp[];
    sharedEnv?: Record<string, string>;
    newSecrets?: Array<{ ref: string; name: string }>;
}

export interface DeploymentPlanStep {
    action: 'create-app' | 'set-env' | 'create-secret' | 'link';
    describe: string;
}

export interface DeploymentPlan {
    planId: string;
    summary: string;
    steps: DeploymentPlanStep[];
    warnings: string[];
}

export interface DeploymentApplyResult {
    created: Array<{ ref: string; id: number; url: string }>;
    status: 'complete' | 'rolled_back' | 'partial';
    failedStep?: { describe: string; error: string };
}
