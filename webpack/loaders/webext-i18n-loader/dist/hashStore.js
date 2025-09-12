"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHashStore = exports.HashStore = void 0;
const crypto_1 = __importDefault(require("crypto"));
const schema_utils_1 = require("schema-utils");
class HashStore {
    constructor(options) {
        (0, schema_utils_1.validate)({
            type: 'object',
            properties: {
                alg: {
                    type: 'string',
                },
            },
            additionalProperties: true,
        }, options);
        this.options = options;
        this.contextHash = new Map();
        this.msgIdHash = new Map();
    }
    digsetContext(context) {
        return crypto_1.default.hash(this.options.alg, context, 'hex').slice(0, 7);
    }
    digsetMsgId(msgId) {
        return crypto_1.default.hash(this.options.alg, msgId, 'hex').slice(0, 10);
    }
    saveContext(context) {
        const digestedHash = this.contextHash.get(context);
        if (digestedHash)
            return digestedHash;
        const hash = this.digsetContext(context);
        this.contextHash.set(context, hash);
        return hash;
    }
    getContextHash(context) {
        return this.contextHash.get(context);
    }
    saveMsgId(msgId) {
        const digestedHash = this.msgIdHash.get(msgId);
        if (digestedHash)
            return digestedHash;
        const hash = this.digsetMsgId(msgId);
        this.msgIdHash.set(msgId, hash);
        return hash;
    }
    getMsgIdHash(msgId) {
        return this.msgIdHash.get(msgId);
    }
}
exports.HashStore = HashStore;
exports.getHashStore = (() => {
    let store;
    return () => (store !== null && store !== void 0 ? store : (store = new HashStore({ alg: 'sha256' })));
})();
//# sourceMappingURL=hashStore.js.map