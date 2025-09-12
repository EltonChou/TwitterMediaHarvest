export type HashOptions = {
    alg: 'sha256' | string;
};
export declare class HashStore {
    protected options: HashOptions;
    readonly contextHash: Map<string, string>;
    readonly msgIdHash: Map<string, string>;
    constructor(options: HashOptions);
    digsetContext(context: string): string;
    digsetMsgId(msgId: string): string;
    saveContext(context: string): string;
    getContextHash(context: string): string | undefined;
    saveMsgId(msgId: string): string;
    getMsgIdHash(msgId: string): string | undefined;
}
export declare const getHashStore: () => HashStore;
