import { z } from 'zod';
import type { TemplateDetail, AppDetail, SecretSummary } from './types.js';
export declare const TemplateDetailSchema: z.ZodType<TemplateDetail>;
export declare const AppDetailSchema: z.ZodType<AppDetail>;
export declare const SecretSummarySchema: z.ZodType<SecretSummary>;
export declare const fixtureSchemas: {
    readonly templates: z.ZodArray<z.ZodType<TemplateDetail, z.ZodTypeDef, TemplateDetail>, "many">;
    readonly apps: z.ZodArray<z.ZodType<AppDetail, z.ZodTypeDef, AppDetail>, "many">;
    readonly secrets: z.ZodArray<z.ZodType<SecretSummary, z.ZodTypeDef, SecretSummary>, "many">;
};
export type FixtureName = keyof typeof fixtureSchemas;
//# sourceMappingURL=schemas.d.ts.map