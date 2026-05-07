import type { Request } from "express";
import { SofService } from "../sof/sof.service";
import { CreateLighterTripDto } from "./dto/create-lighter-trip.dto";
import { ListLighterTripsQueryDto } from "./dto/list-lighter-trips.query.dto";
import { UpdateLighterTripDto } from "./dto/update-lighter-trip.dto";
import { LighterTripsService } from "./lighter-trips.service";
type AuthedRequest = Request & {
    user?: {
        userId: string;
    };
};
export declare class LighterTripsController {
    private readonly lighterTripsService;
    private readonly sofService;
    constructor(lighterTripsService: LighterTripsService, sofService: SofService);
    list(query: ListLighterTripsQueryDto): Promise<{
        data: {
            vesselCall: {
                vessel: {
                    id: string;
                    name: string;
                };
                id: string;
                status: import(".prisma/client").$Enums.MotherVesselStatus;
                callNo: string;
            };
            statementOfFacts: {
                id: string;
                status: import(".prisma/client").$Enums.SOFStatus;
                sofNo: string;
            } | null;
            id: string;
            status: import(".prisma/client").$Enums.LighterTripStatus;
            tripNo: string;
            assignedAt: Date;
            lighterVessel: {
                id: string;
                name: string;
                imoNo: string | null;
            };
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    dischargeMetricsByCalls(vesselCallIds: string): Promise<{
        byVesselCallId: Record<string, ReturnType<typeof import("./lighter-trip-board-metrics").aggregateBoardMetrics>>;
    }>;
    openAssignments(vesselCallId: string): Promise<{
        carrier: {
            organization: {
                name: string;
            };
            id: string;
        };
        lighter: {
            id: string;
            name: string;
        };
        id: string;
        status: import(".prisma/client").$Enums.LighterStatus;
        trip: {
            id: string;
        } | null;
        assignmentNo: string;
        estimatedQtyMt: import("@prisma/client-runtime-utils").Decimal;
        destinationGhat: {
            id: string;
            name: string;
        };
    }[]>;
    lighterVessels(search?: string, limit?: string, id?: string): Promise<{
        activeTrip: {
            id: string;
            tripNo: string;
            status: import(".prisma/client").$Enums.LighterTripStatus;
            vesselCall: {
                vessel: {
                    name: string;
                };
                id: string;
                callNo: string;
            };
        } | null;
        id: string;
        name: string;
        imoNo: string | null;
        flag: string | null;
    }[]>;
    create(dto: CreateLighterTripDto, req: AuthedRequest): Promise<{
        vesselCall: {
            vessel: {
                id: string;
                name: string;
                imoNo: string | null;
            };
            id: string;
            status: import(".prisma/client").$Enums.MotherVesselStatus;
            callNo: string;
            cargoNameSnapshot: string | null;
            totalDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
        };
        lighterAssignment: {
            id: string;
            status: import(".prisma/client").$Enums.LighterStatus;
            holdReason: string | null;
            alongsideDate: Date | null;
            departedMvDate: Date | null;
            arrivedGhatDate: Date | null;
            assignmentNo: string;
            estimatedQtyMt: import("@prisma/client-runtime-utils").Decimal;
            surveyorLoadedQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            actualDischargedQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            carrierConfirmedDate: Date | null;
            readyDate: Date | null;
            departedDate: Date | null;
            arrivedMvDate: Date | null;
            loadingStartDate: Date | null;
            loadingSuspendedDate: Date | null;
            loadingResumedDate: Date | null;
            loadingCompleteDate: Date | null;
            unloadingStartDate: Date | null;
            unloadingSuspendedDate: Date | null;
            unloadingResumedDate: Date | null;
            unloadingCompleteDate: Date | null;
            destinationGhat: {
                id: string;
                name: string;
            };
        } | null;
        statementOfFacts: {
            id: string;
            status: import(".prisma/client").$Enums.SOFStatus;
            sofNo: string;
        } | null;
        _count: {
            events: number;
            cargoes: number;
        };
        events: {
            id: string;
            remarks: string | null;
            eventTime: Date;
            statusAfter: import(".prisma/client").$Enums.LighterTripStatus | null;
            direction: import(".prisma/client").$Enums.EventDirection | null;
        }[];
        cargoes: {
            product: {
                id: string;
                name: string;
            };
            id: string;
            remarks: string | null;
            estimatedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            agreedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            loadedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            dischargedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            differenceQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
        lighterVessel: {
            id: string;
            name: string;
            imoNo: string | null;
            flag: string | null;
            isLighter: boolean;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.LighterTripStatus;
        remarks: string | null;
        vesselCallId: string;
        laytimeCommenceAt: Date | null;
        holdReason: string | null;
        tripNo: string;
        lighterAssignmentId: string | null;
        lighterVesselId: string;
        assignedById: string | null;
        returnLocationId: string | null;
        destinationType: import(".prisma/client").$Enums.SaleAllocationType | null;
        masterName: string | null;
        masterPhone: string | null;
        masterLicenseNo: string | null;
        assistantName: string | null;
        assistantPhone: string | null;
        numberOfCrew: number | null;
        lighterCapacityTon: import("@prisma/client-runtime-utils").Decimal | null;
        hasSurveyorScout: boolean | null;
        hasImporterScout: boolean | null;
        surveyorScoutBoardedAt: Date | null;
        importerScoutBoardedAt: Date | null;
        assignedAt: Date;
        wayToMVReadyAt: Date | null;
        wayToMVStartedAt: Date | null;
        wayToMVCompletedAt: Date | null;
        alongsideDate: Date | null;
        loadingStartedAt: Date | null;
        loadingCompletedAt: Date | null;
        draftSurveyId: string | null;
        draftSurveyWeightMt: import("@prisma/client-runtime-utils").Decimal | null;
        draftSurveyStatus: string | null;
        departedMvDate: Date | null;
        wayToGhatStartedAt: Date | null;
        wayToGhatCompletedAt: Date | null;
        arrivedGhatDate: Date | null;
        unloadStartedAt: Date | null;
        unloadCompletedAt: Date | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
    }>;
    getOne(id: string): Promise<{
        vesselCall: {
            vessel: {
                id: string;
                name: string;
                imoNo: string | null;
            };
            id: string;
            status: import(".prisma/client").$Enums.MotherVesselStatus;
            callNo: string;
            cargoNameSnapshot: string | null;
            totalDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
        };
        lighterAssignment: {
            id: string;
            status: import(".prisma/client").$Enums.LighterStatus;
            holdReason: string | null;
            alongsideDate: Date | null;
            departedMvDate: Date | null;
            arrivedGhatDate: Date | null;
            assignmentNo: string;
            estimatedQtyMt: import("@prisma/client-runtime-utils").Decimal;
            surveyorLoadedQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            actualDischargedQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            carrierConfirmedDate: Date | null;
            readyDate: Date | null;
            departedDate: Date | null;
            arrivedMvDate: Date | null;
            loadingStartDate: Date | null;
            loadingSuspendedDate: Date | null;
            loadingResumedDate: Date | null;
            loadingCompleteDate: Date | null;
            unloadingStartDate: Date | null;
            unloadingSuspendedDate: Date | null;
            unloadingResumedDate: Date | null;
            unloadingCompleteDate: Date | null;
            destinationGhat: {
                id: string;
                name: string;
            };
        } | null;
        statementOfFacts: {
            id: string;
            status: import(".prisma/client").$Enums.SOFStatus;
            sofNo: string;
        } | null;
        _count: {
            events: number;
            cargoes: number;
        };
        events: {
            id: string;
            remarks: string | null;
            eventTime: Date;
            statusAfter: import(".prisma/client").$Enums.LighterTripStatus | null;
            direction: import(".prisma/client").$Enums.EventDirection | null;
        }[];
        cargoes: {
            product: {
                id: string;
                name: string;
            };
            id: string;
            remarks: string | null;
            estimatedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            agreedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            loadedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            dischargedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            differenceQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
        lighterVessel: {
            id: string;
            name: string;
            imoNo: string | null;
            flag: string | null;
            isLighter: boolean;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.LighterTripStatus;
        remarks: string | null;
        vesselCallId: string;
        laytimeCommenceAt: Date | null;
        holdReason: string | null;
        tripNo: string;
        lighterAssignmentId: string | null;
        lighterVesselId: string;
        assignedById: string | null;
        returnLocationId: string | null;
        destinationType: import(".prisma/client").$Enums.SaleAllocationType | null;
        masterName: string | null;
        masterPhone: string | null;
        masterLicenseNo: string | null;
        assistantName: string | null;
        assistantPhone: string | null;
        numberOfCrew: number | null;
        lighterCapacityTon: import("@prisma/client-runtime-utils").Decimal | null;
        hasSurveyorScout: boolean | null;
        hasImporterScout: boolean | null;
        surveyorScoutBoardedAt: Date | null;
        importerScoutBoardedAt: Date | null;
        assignedAt: Date;
        wayToMVReadyAt: Date | null;
        wayToMVStartedAt: Date | null;
        wayToMVCompletedAt: Date | null;
        alongsideDate: Date | null;
        loadingStartedAt: Date | null;
        loadingCompletedAt: Date | null;
        draftSurveyId: string | null;
        draftSurveyWeightMt: import("@prisma/client-runtime-utils").Decimal | null;
        draftSurveyStatus: string | null;
        departedMvDate: Date | null;
        wayToGhatStartedAt: Date | null;
        wayToGhatCompletedAt: Date | null;
        arrivedGhatDate: Date | null;
        unloadStartedAt: Date | null;
        unloadCompletedAt: Date | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
    }>;
    update(id: string, dto: UpdateLighterTripDto): Promise<{
        vesselCall: {
            vessel: {
                id: string;
                name: string;
                imoNo: string | null;
            };
            id: string;
            status: import(".prisma/client").$Enums.MotherVesselStatus;
            callNo: string;
            cargoNameSnapshot: string | null;
            totalDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
        };
        lighterAssignment: {
            id: string;
            status: import(".prisma/client").$Enums.LighterStatus;
            holdReason: string | null;
            alongsideDate: Date | null;
            departedMvDate: Date | null;
            arrivedGhatDate: Date | null;
            assignmentNo: string;
            estimatedQtyMt: import("@prisma/client-runtime-utils").Decimal;
            surveyorLoadedQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            actualDischargedQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            carrierConfirmedDate: Date | null;
            readyDate: Date | null;
            departedDate: Date | null;
            arrivedMvDate: Date | null;
            loadingStartDate: Date | null;
            loadingSuspendedDate: Date | null;
            loadingResumedDate: Date | null;
            loadingCompleteDate: Date | null;
            unloadingStartDate: Date | null;
            unloadingSuspendedDate: Date | null;
            unloadingResumedDate: Date | null;
            unloadingCompleteDate: Date | null;
            destinationGhat: {
                id: string;
                name: string;
            };
        } | null;
        statementOfFacts: {
            id: string;
            status: import(".prisma/client").$Enums.SOFStatus;
            sofNo: string;
        } | null;
        _count: {
            events: number;
            cargoes: number;
        };
        events: {
            id: string;
            remarks: string | null;
            eventTime: Date;
            statusAfter: import(".prisma/client").$Enums.LighterTripStatus | null;
            direction: import(".prisma/client").$Enums.EventDirection | null;
        }[];
        cargoes: {
            product: {
                id: string;
                name: string;
            };
            id: string;
            remarks: string | null;
            estimatedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            agreedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            loadedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            dischargedQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
            differenceQtyTon: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
        lighterVessel: {
            id: string;
            name: string;
            imoNo: string | null;
            flag: string | null;
            isLighter: boolean;
        };
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.LighterTripStatus;
        remarks: string | null;
        vesselCallId: string;
        laytimeCommenceAt: Date | null;
        holdReason: string | null;
        tripNo: string;
        lighterAssignmentId: string | null;
        lighterVesselId: string;
        assignedById: string | null;
        returnLocationId: string | null;
        destinationType: import(".prisma/client").$Enums.SaleAllocationType | null;
        masterName: string | null;
        masterPhone: string | null;
        masterLicenseNo: string | null;
        assistantName: string | null;
        assistantPhone: string | null;
        numberOfCrew: number | null;
        lighterCapacityTon: import("@prisma/client-runtime-utils").Decimal | null;
        hasSurveyorScout: boolean | null;
        hasImporterScout: boolean | null;
        surveyorScoutBoardedAt: Date | null;
        importerScoutBoardedAt: Date | null;
        assignedAt: Date;
        wayToMVReadyAt: Date | null;
        wayToMVStartedAt: Date | null;
        wayToMVCompletedAt: Date | null;
        alongsideDate: Date | null;
        loadingStartedAt: Date | null;
        loadingCompletedAt: Date | null;
        draftSurveyId: string | null;
        draftSurveyWeightMt: import("@prisma/client-runtime-utils").Decimal | null;
        draftSurveyStatus: string | null;
        departedMvDate: Date | null;
        wayToGhatStartedAt: Date | null;
        wayToGhatCompletedAt: Date | null;
        arrivedGhatDate: Date | null;
        unloadStartedAt: Date | null;
        unloadCompletedAt: Date | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
    }>;
    approveLighterSof(id: string, req: AuthedRequest): Promise<{
        vesselCall: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.MotherVesselStatus;
            laytimeCommenceAt: Date | null;
            callNo: string;
            vesselId: string;
            importContractId: string | null;
            arrivalLocationId: string | null;
            shippingAgentId: string | null;
            stevedoreId: string | null;
            cnfId: string | null;
            eta: Date | null;
            etd: Date | null;
            ata: Date | null;
            atd: Date | null;
            anchorDroppedAt: Date | null;
            norTenderedAt: Date | null;
            norAcceptedAt: Date | null;
            norRejectedAt: Date | null;
            norRejectionReason: string | null;
            norNumber: string | null;
            laytimeTimeZone: string | null;
            igmDate: Date | null;
            customsClearanceDate: Date | null;
            quarantineClearanceDate: Date | null;
            portAuthorityClearanceDate: Date | null;
            readyToDischargeAt: Date | null;
            dischargeStartedAt: Date | null;
            dischargeCompletedAt: Date | null;
            anchorUpAt: Date | null;
            cargoNameSnapshot: string | null;
            approxTotalWeightTon: import("@prisma/client-runtime-utils").Decimal | null;
            toleranceMinusPct: import("@prisma/client-runtime-utils").Decimal | null;
            tolerancePlusPct: import("@prisma/client-runtime-utils").Decimal | null;
            holdReason: string | null;
            currentAnchorage: string | null;
            isAnchored: boolean | null;
            isAlongside: boolean | null;
            addedById: string | null;
            updatedById: string | null;
            totalStages: number;
            completedStages: number;
            lastStageCompletedAt: Date | null;
            nextStageExpectedAt: Date | null;
            anchorageDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
            alongsideDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
            totalDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
        } | null;
        lighterTrip: {
            id: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.LighterTripStatus;
            remarks: string | null;
            vesselCallId: string;
            laytimeCommenceAt: Date | null;
            holdReason: string | null;
            tripNo: string;
            lighterAssignmentId: string | null;
            lighterVesselId: string;
            assignedById: string | null;
            returnLocationId: string | null;
            destinationType: import(".prisma/client").$Enums.SaleAllocationType | null;
            masterName: string | null;
            masterPhone: string | null;
            masterLicenseNo: string | null;
            assistantName: string | null;
            assistantPhone: string | null;
            numberOfCrew: number | null;
            lighterCapacityTon: import("@prisma/client-runtime-utils").Decimal | null;
            hasSurveyorScout: boolean | null;
            hasImporterScout: boolean | null;
            surveyorScoutBoardedAt: Date | null;
            importerScoutBoardedAt: Date | null;
            assignedAt: Date;
            wayToMVReadyAt: Date | null;
            wayToMVStartedAt: Date | null;
            wayToMVCompletedAt: Date | null;
            alongsideDate: Date | null;
            loadingStartedAt: Date | null;
            loadingCompletedAt: Date | null;
            draftSurveyId: string | null;
            draftSurveyWeightMt: import("@prisma/client-runtime-utils").Decimal | null;
            draftSurveyStatus: string | null;
            departedMvDate: Date | null;
            wayToGhatStartedAt: Date | null;
            wayToGhatCompletedAt: Date | null;
            arrivedGhatDate: Date | null;
            unloadStartedAt: Date | null;
            unloadCompletedAt: Date | null;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
        } | null;
        _count: {
            vesselCall: number;
            lighterTrip: number;
            events: number;
            hourlyStatuses: number;
            verifiedByUser: number;
        };
        events: {
            location: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            remarks: string | null;
            laytimeImpactHours: import("@prisma/client-runtime-utils").Decimal | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
            eventTime: Date;
            holdReason: string | null;
            statementId: string;
            eventTypeId: string;
            durationHours: import("@prisma/client-runtime-utils").Decimal | null;
            durationMinutes: number | null;
            countsAsLaytime: boolean;
            anchorageId: string | null;
            robQuantityMt: import("@prisma/client-runtime-utils").Decimal | null;
            dischargeQuantityMt: import("@prisma/client-runtime-utils").Decimal | null;
            cumulativeDischargeMt: import("@prisma/client-runtime-utils").Decimal | null;
            isHold: boolean;
            responsibleParty: string | null;
            laytimeAccount: string | null;
            referenceNo: string | null;
            supportingDocuments: string[];
            createdBy: string;
            operationBatchId: string | null;
        }[];
        hourlyStatuses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            remarks: string | null;
            lighterTripId: string | null;
            holdReason: string | null;
            statementId: string;
            eventTypeId: string | null;
            operationBatchId: string | null;
            cumulativeMt: import("@prisma/client-runtime-utils").Decimal | null;
            hourStartAt: Date;
            dailyDischargeId: string | null;
            hourEndAt: Date | null;
            statusText: string;
            dischargeQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            robQtyMt: import("@prisma/client-runtime-utils").Decimal | null;
            createdById: string | null;
        }[];
        verifiedByUser: {
            fullName: string;
            phone: string;
            id: string;
            email: string | null;
            passwordHash: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            organizationId: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SOFStatus;
        remarks: string | null;
        approvedAt: Date | null;
        approvedBy: string | null;
        sofNo: string;
        scope: import(".prisma/client").$Enums.SOFScope;
        vesselCallId: string | null;
        lighterTripId: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        laytimeAllowedHours: import("@prisma/client-runtime-utils").Decimal | null;
        laytimeUsedHours: import("@prisma/client-runtime-utils").Decimal | null;
        laytimeExcludedHours: import("@prisma/client-runtime-utils").Decimal | null;
        laytimeBalanceHours: import("@prisma/client-runtime-utils").Decimal | null;
        laytimeCommenceAt: Date | null;
        demurrageAmount: import("@prisma/client-runtime-utils").Decimal | null;
        dispatchAmount: import("@prisma/client-runtime-utils").Decimal | null;
        netAmount: import("@prisma/client-runtime-utils").Decimal | null;
        verifiedBy: string | null;
        verifiedAt: Date | null;
    }>;
}
export {};
