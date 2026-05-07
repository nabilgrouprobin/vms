export declare const DEFAULT_SOF_PAGE_SIZE = 25;
export declare const MAX_SOF_PAGE_SIZE = 100;
export declare const SOF_STATUS_FLOW: {
    readonly DRAFT: readonly ["PENDING_VERIFICATION", "DISPUTED", "CLOSED"];
    readonly PENDING_VERIFICATION: readonly ["VERIFIED", "DISPUTED", "DRAFT"];
    readonly VERIFIED: readonly ["APPROVED", "DISPUTED"];
    readonly APPROVED: readonly ["CLOSED", "DISPUTED"];
    readonly DISPUTED: readonly ["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "CLOSED"];
    readonly CLOSED: readonly [];
};
