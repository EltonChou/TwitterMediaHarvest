import { type HashStore } from './hashStore';
import type { Compiler, WebpackPluginInstance } from 'webpack';
export interface WebextI18nPluginOptions {
    poDir: string;
    rawContexts?: string | RegExp | (string | RegExp)[];
    messageIdMaker?: (msgId: string, context?: string) => string;
}
export declare class WebextI18nPlugin implements WebpackPluginInstance {
    readonly options: WebextI18nPluginOptions;
    readonly hashStore: HashStore;
    constructor(options: WebextI18nPluginOptions);
    isRawContext(context?: string): boolean;
    makeMsgId(msgId: string, context?: string): string;
    transformToLocaleMsgId(hashStore: HashStore): (msgId: string, context?: string) => string;
    apply(compiler: Compiler): void;
}
