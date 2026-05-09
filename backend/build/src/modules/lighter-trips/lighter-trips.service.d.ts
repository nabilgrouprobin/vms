import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateLighterTripDto } from "./dto/create-lighter-trip.dto";
import { ListLighterTripsQueryDto } from "./dto/list-lighter-trips.query.dto";
import { UpdateLighterTripDto } from "./dto/update-lighter-trip.dto";
import { aggregateBoardMetrics } from "./lighter-trip-board-metrics";
export declare class LighterTripsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    private parseGhatAgingLimit;
    private listGhatAgingReport;
    getById(id: string): Promise<{
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
            totalDischargeMt: Prisma.Decimal | null;
        };
        lighterAssignment: {
            id: string;
            status: import(".prisma/client").$Enums.LighterStatus;
            holdReason: string | null;
            alongsideDate: Date | null;
            departedMvDate: Date | null;
            arrivedGhatDate: Date | null;
            assignmentNo: string;
            estimatedQtyMt: Prisma.Decimal;
            surveyorLoadedQtyMt: Prisma.Decimal | null;
            actualDischargedQtyMt: Prisma.Decimal | null;
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
            estimatedQtyTon: Prisma.Decimal | null;
            agreedQtyTon: Prisma.Decimal | null;
            loadedQtyTon: Prisma.Decimal | null;
            dischargedQtyTon: Prisma.Decimal | null;
            differenceQtyTon: Prisma.Decimal | null;
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
        lighterCapacityTon: Prisma.Decimal | null;
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
        draftSurveyWeightMt: Prisma.Decimal | null;
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
            totalDischargeMt: Prisma.Decimal | null;
        };
        lighterAssignment: {
            id: string;
            status: import(".prisma/client").$Enums.LighterStatus;
            holdReason: string | null;
            alongsideDate: Date | null;
            departedMvDate: Date | null;
            arrivedGhatDate: Date | null;
            assignmentNo: string;
            estimatedQtyMt: Prisma.Decimal;
            surveyorLoadedQtyMt: Prisma.Decimal | null;
            actualDischargedQtyMt: Prisma.Decimal | null;
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
            estimatedQtyTon: Prisma.Decimal | null;
            agreedQtyTon: Prisma.Decimal | null;
            loadedQtyTon: Prisma.Decimal | null;
            dischargedQtyTon: Prisma.Decimal | null;
            differenceQtyTon: Prisma.Decimal | null;
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
        lighterCapacityTon: Prisma.Decimal | null;
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
        draftSurveyWeightMt: Prisma.Decimal | null;
        draftSurveyStatus: string | null;
        departedMvDate: Date | null;
        wayToGhatStartedAt: Date | null;
        wayToGhatCompletedAt: Date | null;
        arrivedGhatDate: Date | null;
        unloadStartedAt: Date | null;
        unloadCompletedAt: Date | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
    }>;
    listOpenAssignmentsForVesselCall(vesselCallId: string): Promise<{
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
        estimatedQtyMt: Prisma.Decimal;
        destinationGhat: {
            id: string;
            name: string;
        };
    }[]>;
    listLighterVesselsForPicker(search?: string, limitRaw?: string, idRaw?: string): Promise<{
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
    private allocateTripNo;
    private allocateAssignmentNo;
    private makeAutoCode;
    private ensureAutoCarrierWithLighter;
    private ensureAutoGhat;
    create(dto: CreateLighterTripDto, assignedById: string | undefined): Promise<{
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
            totalDischargeMt: Prisma.Decimal | null;
        };
        lighterAssignment: {
            id: string;
            status: import(".prisma/client").$Enums.LighterStatus;
            holdReason: string | null;
            alongsideDate: Date | null;
            departedMvDate: Date | null;
            arrivedGhatDate: Date | null;
            assignmentNo: string;
            estimatedQtyMt: Prisma.Decimal;
            surveyorLoadedQtyMt: Prisma.Decimal | null;
            actualDischargedQtyMt: Prisma.Decimal | null;
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
            estimatedQtyTon: Prisma.Decimal | null;
            agreedQtyTon: Prisma.Decimal | null;
            loadedQtyTon: Prisma.Decimal | null;
            dischargedQtyTon: Prisma.Decimal | null;
            differenceQtyTon: Prisma.Decimal | null;
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
        lighterCapacityTon: Prisma.Decimal | null;
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
        draftSurveyWeightMt: Prisma.Decimal | null;
        draftSurveyStatus: string | null;
        departedMvDate: Date | null;
        wayToGhatStartedAt: Date | null;
        wayToGhatCompletedAt: Date | null;
        arrivedGhatDate: Date | null;
        unloadStartedAt: Date | null;
        unloadCompletedAt: Date | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus | null;
    }>;
    private parseOptionalMtDecimal;
    dischargeMetricsForVesselCallIds(vesselCallIdsRaw: string | undefined): Promise<{
        byVesselCallId: Record<string, ReturnType<typeof aggregateBoardMetrics>>;
    }>;
}
