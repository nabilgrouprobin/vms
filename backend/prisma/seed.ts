import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import {
  AppRole,
  LighterTripStatus,
  LocationType,
  MotherVesselStatus,
  PrismaClient,
  ProductType,
  SOFScope,
  SOFStatus
} from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed VMS master data');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

/** Matches migrated legacy definitions (`sof_event_type_definitions`). */
const MOTHER_SEED_EVENT_TYPE_IDS = [
  'sofetype_legacy_nor_tendered',
  'sofetype_legacy_nor_accepted',
  'sofetype_legacy_lc_released',
  'sofetype_legacy_discharge_started',
  'sofetype_legacy_hold',
  'sofetype_legacy_discharge_stopped',
  'sofetype_legacy_shifting',
  'sofetype_legacy_breakdown',
  'sofetype_legacy_completed',
  'sofetype_legacy_anchor_up'
] as const;

const SEED_EVT_HOLD_ID = 'sofetype_legacy_hold';

const eventRemarks = [
  'NOR tendered by mother vessel.',
  'NOR accepted by operations desk.',
  'LC release confirmed for discharge.',
  'Discharge operation started.',
  'Waiting due to lighter availability.',
  'Discharge stopped for weather window.',
  'Vessel shifted to assigned anchorage.',
  'Discharge resumed after shifting.',
  'Crane breakdown reported and logged.',
  'Discharge resumed after repair.',
  'Cargo operation completed.',
  'Anchor aweigh and operation closed.'
];

const locations = [
  'Outer Anchorage A',
  'Outer Anchorage B',
  'Outer Anchorage C',
  'Inner Anchorage A',
  'Inner Anchorage B',
  'Berth 1',
  'Berth 2',
  'Jetty 3',
  'MV port side',
  'MV starboard side',
  'X lighter alongside',
  'Y lighter alongside'
];

const responsibleParties = [
  'Master',
  'Shipping Agent',
  'Stevedore',
  'Terminal',
  'Port Authority',
  'Surveyor',
  'CNF Agent',
  'Lighter Operator',
  'Carrier Coordinator',
  'Operations Desk',
  'Weather Delay',
  'Charterer'
];

function daysFromBase(days: number, hours = 0, minutes = 0) {
  return new Date(Date.UTC(2026, 4, 1 + days, hours, minutes, 0));
}

/** Dhaka-style date segment for seeded call/trip numbers (matches seed timeline anchor). */
const SEED_OPS_DATE_SEG = '26-05-01';

function padHull(n: number) {
  return String(n).padStart(3, '0');
}

async function main() {
  const organizations: Array<{ id: string }> = [];
  const users: Array<{ id: string; email: string | null }> = [];
  const seededLocations: Array<{ id: string }> = [];
  const anchorages: Array<{ id: string }> = [];
  const products: Array<{ id: string; name: string }> = [];
  const vessels: Array<{ id: string }> = [];
  const vesselCalls: Array<{ id: string }> = [];
  const statements: Array<{ id: string }> = [];
  const lighterTrips: Array<{ id: string }> = [];

  const demoLoginPassword = process.env.SEED_DEMO_PASSWORD ?? 'ChangeMe!123';
  const demoPasswordHash = await bcrypt.hash(demoLoginPassword, 12);

  const orgTypeRows = await prisma.organizationTypeDefinition.findMany({
    select: { id: true, code: true }
  });
  const orgTypeIdByCode = new Map(orgTypeRows.map((r) => [r.code, r.id]));

  for (let index = 0; index < 12; index += 1) {
    const serial = String(index + 1).padStart(2, '0');
    const organizationTypeCode =
      index % 4 === 0
        ? 'OWN_COMPANY'
        : index % 4 === 1
          ? 'SHIPPING_AGENT'
          : index % 4 === 2
            ? 'STEVEDORE'
            : 'CNF';

    const organizationTypeId = orgTypeIdByCode.get(organizationTypeCode);
    if (!organizationTypeId) {
      throw new Error(`Seed missing organization type code ${organizationTypeCode}`);
    }

    const organization = await prisma.organization.upsert({
      where: {
        code: `SOF-ORG-${serial}`
      },
      update: {
        name: `SOF Organization ${serial}`,
        isActive: true,
        organizationTypeId
      },
      create: {
        code: `SOF-ORG-${serial}`,
        name: `SOF Organization ${serial}`,
        organizationTypeId,
        contactPerson: `Contact ${serial}`,
        contactNo: `+88017000001${serial}`,
        email: `sof.org.${serial}@example.com`
      }
    });
    organizations.push(organization);

    const user = await prisma.user.upsert({
      where: {
        email: `sof.operator.${serial}@example.com`
      },
      update: {
        fullName: `SOF Operator ${serial}`,
        isActive: true,
        organizationId: organization.id,
        ...(serial === '01' ? { passwordHash: demoPasswordHash } : {})
      },
      create: {
        email: `sof.operator.${serial}@example.com`,
        phone: `+88018000001${serial}`,
        fullName: `SOF Operator ${serial}`,
        organizationId: organization.id,
        ...(serial === '01' ? { passwordHash: demoPasswordHash } : {})
      }
    });
    users.push(user);

    const location = await prisma.location.upsert({
      where: {
        code_type: {
          code: `SOF-LOC-${serial}`,
          type: LocationType.ANCHORAGE
        }
      },
      update: {
        name: locations[index],
        isActive: true
      },
      create: {
        code: `SOF-LOC-${serial}`,
        name: locations[index],
        type: LocationType.ANCHORAGE,
        district: 'Chattogram',
        division: 'Chattogram',
        country: 'Bangladesh',
        isActive: true
      }
    });
    seededLocations.push(location);

    const anchorage = await prisma.anchorage.upsert({
      where: {
        code: `SOF-ANCH-${serial}`
      },
      update: {
        name: locations[index],
        locationId: location.id,
        isActive: true
      },
      create: {
        code: `SOF-ANCH-${serial}`,
        name: locations[index],
        locationId: location.id,
        isActive: true
      }
    });
    anchorages.push(anchorage);

    const product = await prisma.product.upsert({
      where: {
        code: `SOF-PROD-${serial}`
      },
      update: {
        name: `Bulk Cargo ${serial}`,
        isActive: true
      },
      create: {
        code: `SOF-PROD-${serial}`,
        name: `Bulk Cargo ${serial}`,
        type: index % 2 === 0 ? ProductType.BULK_FOOD_GRAIN : ProductType.FERTILIZER,
        specification: `Seed cargo specification ${serial}`,
        defaultUom: 'MT',
        hsCode: `100${serial}`,
        isActive: true
      }
    });
    products.push(product);

    const motherHullCode = index + 1;
    const vessel = await prisma.vessel.upsert({
      where: {
        name: `MV Atlas ${serial}`
      },
      update: {
        isMotherVessel: true,
        isLighter: false,
        isActive: true,
        hullDisplayCode: motherHullCode
      },
      create: {
        name: `MV Atlas ${serial}`,
        imoNo: `IMO-SOF-${serial}`,
        vesselType: 'Bulk Carrier',
        flag: index % 2 === 0 ? 'Panama' : 'Liberia',
        deadweightTon: `${56500 + index * 500}.000`,
        maxDraftMeters: `${12 + index / 10}`,
        lengthOverallM: `${185 + index}.80`,
        beamM: '32.20',
        yearBuilt: 2012 + index,
        isMotherVessel: true,
        isLighter: false,
        isActive: true,
        hullDisplayCode: motherHullCode
      }
    });
    vessels.push(vessel);

    const norTenderedAt = daysFromBase(index, 6, 0);
    const dischargeStartedAt = daysFromBase(index, 12, 30);
    const completedAt = daysFromBase(index, 23, 45);

    const motherCallId = `seed-vcall-mv-${serial}`;
    const motherCallNo = `${SEED_OPS_DATE_SEG}-${padHull(motherHullCode)}-001`;
    const vesselCall = await prisma.vesselCall.upsert({
      where: {
        id: motherCallId
      },
      update: {
        callNo: motherCallNo,
        vesselId: vessel.id,
        arrivalLocationId: location.id,
        shippingAgentId: organizations[(index + 1) % organizations.length].id,
        stevedoreId: organizations[(index + 2) % organizations.length].id,
        cnfId: organizations[(index + 3) % organizations.length].id,
        status: index % 3 === 0 ? MotherVesselStatus.DISCHARGING : MotherVesselStatus.READY_TO_DISCHARGE,
        updatedById: user.id
      },
      create: {
        id: motherCallId,
        callNo: motherCallNo,
        vesselId: vessel.id,
        arrivalLocationId: location.id,
        shippingAgentId: organizations[(index + 1) % organizations.length].id,
        stevedoreId: organizations[(index + 2) % organizations.length].id,
        cnfId: organizations[(index + 3) % organizations.length].id,
        eta: daysFromBase(index - 1, 18, 0),
        ata: norTenderedAt,
        anchorDroppedAt: daysFromBase(index, 5, 30),
        norTenderedAt,
        norAcceptedAt: daysFromBase(index, 7, 0),
        laytimeCommenceAt: daysFromBase(index, 8, 0),
        readyToDischargeAt: dischargeStartedAt,
        dischargeStartedAt,
        dischargeCompletedAt: index % 2 === 0 ? completedAt : undefined,
        cargoNameSnapshot: product.name,
        approxTotalWeightTon: `${42000 + index * 750}.000`,
        status: index % 3 === 0 ? MotherVesselStatus.DISCHARGING : MotherVesselStatus.READY_TO_DISCHARGE,
        currentAnchorage: location.name,
        isAnchored: true,
        totalStages: 2,
        completedStages: index % 2 === 0 ? 2 : 1,
        anchorageDischargeMt: `${1200 + index * 110}.000`,
        alongsideDischargeMt: `${800 + index * 90}.000`,
        totalDischargeMt: `${2000 + index * 200}.000`,
        addedById: user.id,
        updatedById: user.id
      }
    });
    vesselCalls.push(vesselCall);

    /** SOF number mirrors the parent call number (1:1 by schema). */
    const motherSofNo = motherCallNo;
    const statement = await prisma.statementOfFacts.upsert({
      where: {
        sofNo: motherSofNo
      },
      update: {
        vesselCallId: vesselCall.id,
        status: index % 4 === 0 ? SOFStatus.VERIFIED : SOFStatus.DRAFT,
        startedAt: norTenderedAt,
        completedAt: index % 2 === 0 ? completedAt : null
      },
      create: {
        sofNo: motherSofNo,
        scope: SOFScope.MOTHER_VESSEL,
        vesselCallId: vesselCall.id,
        startedAt: norTenderedAt,
        completedAt: index % 2 === 0 ? completedAt : undefined,
        status: index % 4 === 0 ? SOFStatus.VERIFIED : SOFStatus.DRAFT,
        laytimeAllowedHours: '120.00',
        laytimeUsedHours: `${24 + index}.50`,
        laytimeExcludedHours: `${index % 3}.00`,
        laytimeBalanceHours: `${95 - index}.50`,
        demurrageAmount: `${index * 1500}.00`,
        dispatchAmount: `${index * 500}.00`,
        netAmount: `${index * 1000}.00`,
        remarks: `Seed SOF ${serial} for local mother vessel operations testing.`
      }
    });
    statements.push(statement);

    await prisma.motherVesselDailyDischarge.upsert({
      where: {
        vesselCallId_reportDate: {
          vesselCallId: vesselCall.id,
          reportDate: daysFromBase(index, 0, 0)
        }
      },
      update: {
        quantity24hMt: `${900 + index * 75}.000`,
        enteredById: user.id
      },
      create: {
        vesselCallId: vesselCall.id,
        reportDate: daysFromBase(index, 0, 0),
        quantity24hMt: `${900 + index * 75}.000`,
        cumulativeMt: `${900 + index * 75}.000`,
        remainingMt: `${41000 - index * 850}.000`,
        enteredById: user.id,
        remarks: `Daily discharge seed row ${serial}.`
      }
    });

    /** Contiguous SOF timeline: `eventTime` is each row end; hour 0 has no duration; later rows use 1 h duration so start = previous end. */
    const motherSofTimelineBase = daysFromBase(index, 6, 0);

    for (let eventIndex = 0; eventIndex < MOTHER_SEED_EVENT_TYPE_IDS.length; eventIndex += 1) {
      const eventSerial = String(eventIndex + 1).padStart(2, '0');
      const eventTime = new Date(motherSofTimelineBase.getTime() + eventIndex * 60 * 60 * 1000);
      const eventTypeId = MOTHER_SEED_EVENT_TYPE_IDS[eventIndex];
      const isHold = eventTypeId === SEED_EVT_HOLD_ID;

      await prisma.sofEvent.upsert({
        where: {
          id: `seed-sof-${serial}-event-${eventSerial}`
        },
        update: {
          statementId: statement.id,
          eventTypeId,
          eventTime,
          durationHours: null,
          durationMinutes: eventIndex === 0 ? null : 60,
          countsAsLaytime: !isHold,
          laytimeImpactHours: isHold ? '0.00' : '1.00',
          isHold,
          holdReason: isHold ? 'Waiting for lighter availability' : null,
          createdBy: user.id,
          location: locations[(index + eventIndex) % locations.length],
          responsibleParty: responsibleParties[(index + eventIndex) % responsibleParties.length],
          remarks: eventRemarks[eventIndex]
        },
        create: {
          id: `seed-sof-${serial}-event-${eventSerial}`,
          statementId: statement.id,
          eventTypeId,
          eventTime,
          durationHours: null,
          durationMinutes: eventIndex === 0 ? undefined : 60,
          countsAsLaytime: !isHold,
          laytimeImpactHours: isHold ? '0.00' : '1.00',
          location: locations[(index + eventIndex) % locations.length],
          anchorageId: anchorages[(index + eventIndex) % anchorages.length].id,
          dischargeQuantityMt: eventIndex >= 3 ? `${150 + eventIndex * 25}.000` : undefined,
          cumulativeDischargeMt: eventIndex >= 3 ? `${(eventIndex - 2) * 175}.000` : undefined,
          isHold,
          holdReason: isHold ? 'Waiting for lighter availability' : undefined,
          responsibleParty: responsibleParties[(index + eventIndex) % responsibleParties.length],
          referenceNo: `SOF-${serial}-${eventSerial}`,
          remarks: eventRemarks[eventIndex],
          supportingDocuments: [],
          createdBy: user.id
        }
      });
    }

    const lighterHullCode = 12 + index + 1;
    const lighterVessel = await prisma.vessel.upsert({
      where: {
        name: `SOF-Lighter-${serial}`
      },
      update: {
        isMotherVessel: false,
        isLighter: true,
        isActive: true,
        hullDisplayCode: lighterHullCode
      },
      create: {
        name: `SOF-Lighter-${serial}`,
        imoNo: `IMO-LV-${serial}`,
        vesselType: 'Self-propelled lighter',
        flag: 'Bangladesh',
        deadweightTon: `${2800 + index * 120}.000`,
        maxDraftMeters: '3.20',
        lengthOverallM: '78.00',
        beamM: '14.50',
        yearBuilt: 2018 + (index % 5),
        isMotherVessel: false,
        isLighter: true,
        isActive: true,
        hullDisplayCode: lighterHullCode
      }
    });

    const tripStatusCycle: LighterTripStatus[] = [
      LighterTripStatus.PLANNED,
      LighterTripStatus.ASSIGNED,
      LighterTripStatus.ALONGSIDE,
      LighterTripStatus.LOADING,
      LighterTripStatus.LOADED,
      LighterTripStatus.ARRIVED_GHAT
    ];
    const tripStatus = tripStatusCycle[index % tripStatusCycle.length];

    const lighterPortCallId = `seed-vcall-lv-${serial}`;
    const lighterPortCallNo = `${SEED_OPS_DATE_SEG}-${padHull(lighterHullCode)}-001`;
    const lighterPortCall = await prisma.vesselCall.upsert({
      where: {
        id: lighterPortCallId
      },
      update: {
        callNo: lighterPortCallNo,
        vesselId: lighterVessel.id,
        arrivalLocationId: location.id,
        status: MotherVesselStatus.EXPECTED,
        updatedById: user.id
      },
      create: {
        id: lighterPortCallId,
        callNo: lighterPortCallNo,
        vesselId: lighterVessel.id,
        arrivalLocationId: location.id,
        eta: daysFromBase(index, 8, 0),
        status: MotherVesselStatus.EXPECTED,
        addedById: user.id,
        updatedById: user.id
      }
    });

    const lighterTripId = `seed-ltrip-${serial}`;
    const lighterTripNo = `${SEED_OPS_DATE_SEG}-${padHull(motherHullCode)}-${padHull(lighterHullCode)}-001`;
    const lighterTrip = await prisma.lighterTrip.upsert({
      where: {
        id: lighterTripId
      },
      update: {
        tripNo: lighterTripNo,
        vesselCallId: vesselCall.id,
        lighterVesselId: lighterVessel.id,
        lighterPortCallId: lighterPortCall.id,
        assignedById: user.id,
        status: tripStatus,
        alongsideDate: daysFromBase(index, 13, 0),
        loadingStartedAt: daysFromBase(index, 14, 30),
        laytimeCommenceAt: daysFromBase(index, 11, 0),
        remarks: `Seed lighter trip for call ${vesselCall.callNo} · lighter ${lighterVessel.name}.`
      } as any,
      create: {
        id: lighterTripId,
        tripNo: lighterTripNo,
        vesselCallId: vesselCall.id,
        lighterVesselId: lighterVessel.id,
        lighterPortCallId: lighterPortCall.id,
        assignedById: user.id,
        assignedAt: daysFromBase(index, 10, 0),
        status: tripStatus,
        laytimeCommenceAt: daysFromBase(index, 11, 0),
        alongsideDate: daysFromBase(index, 13, 0),
        loadingStartedAt: daysFromBase(index, 14, 30),
        loadingCompletedAt:
          index % 4 === 0 ? daysFromBase(index, 18, 0) : undefined,
        departedMvDate: index % 5 === 0 ? daysFromBase(index, 19, 0) : undefined,
        arrivedGhatDate:
          index % 5 === 0 ? daysFromBase(index, 22, 0) : undefined,
        remarks: `Seed lighter trip for call ${vesselCall.callNo} · lighter ${lighterVessel.name}.`
      } as any
    });
    lighterTrips.push(lighterTrip);

    await prisma.lighterTripCargo.upsert({
      where: {
        tripId_productId: {
          tripId: lighterTrip.id,
          productId: product.id
        }
      },
      update: {
        estimatedQtyTon: `${1800 + index * 50}.000`,
        agreedQtyTon: `${1750 + index * 50}.000`
      },
      create: {
        tripId: lighterTrip.id,
        productId: product.id,
        estimatedQtyTon: `${1800 + index * 50}.000`,
        agreedQtyTon: `${1750 + index * 50}.000`,
        remarks: `Seed cargo line for trip ${lighterTrip.tripNo}.`
      }
    });

    const tripEvStatuses: (LighterTripStatus | null)[] = [
      LighterTripStatus.ASSIGNED,
      LighterTripStatus.ALONGSIDE,
      LighterTripStatus.LOADING
    ];
    for (let te = 0; te < tripEvStatuses.length; te += 1) {
      const evSerial = String(te + 1).padStart(2, '0');
      await prisma.lighterTripEvent.upsert({
        where: {
          id: `seed-lt-${serial}-tev-${evSerial}`
        },
        update: {
          tripId: lighterTrip.id,
          eventTime: daysFromBase(index, 10 + te, te * 15),
          statusAfter: tripEvStatuses[te],
          remarks: `Seed trip log ${evSerial}.`
        },
        create: {
          id: `seed-lt-${serial}-tev-${evSerial}`,
          tripId: lighterTrip.id,
          eventTime: daysFromBase(index, 10 + te, te * 15),
          statusAfter: tripEvStatuses[te],
          remarks: `Seed trip log ${evSerial}.`
        }
      });
    }

    /** Some trips already have a lighter SOF; others stay without (test “Create SOF”). */
    if (index % 3 === 1) {
      /** Lighter SOF number mirrors the parent trip number (1:1 by schema). */
      const lighterSofNo = lighterTrip.tripNo;
      const ltStatement = await prisma.statementOfFacts.upsert({
        where: {
          sofNo: lighterSofNo
        },
        update: {
          lighterTripId: lighterTrip.id,
          status: SOFStatus.DRAFT,
          laytimeAllowedHours: '72.00',
          laytimeUsedHours: `${12 + index}.25`,
          laytimeExcludedHours: '1.00',
          laytimeBalanceHours: `${58 - index}.75`
        },
        create: {
          sofNo: lighterSofNo,
          scope: SOFScope.LIGHTER_VESSEL,
          lighterTripId: lighterTrip.id,
          startedAt: daysFromBase(index, 10, 0),
          status: SOFStatus.DRAFT,
          laytimeAllowedHours: '72.00',
          laytimeUsedHours: `${12 + index}.25`,
          laytimeExcludedHours: '1.00',
          laytimeBalanceHours: `${58 - index}.75`,
          remarks: `Seed lighter-vessel SOF for trip ${lighterTrip.tripNo}.`
        }
      });

      const lighterSofTimelineBase = daysFromBase(index, 11, 0);

      for (let le = 0; le < 3; le += 1) {
        const leSerial = String(le + 1).padStart(2, '0');
        const leTime = new Date(lighterSofTimelineBase.getTime() + le * 60 * 60 * 1000);
        const ltEventTypeId =
          le === 0
            ? 'sofetype_legacy_anchor_dropped'
            : le === 1
              ? 'sofetype_legacy_discharge_started'
              : 'sofetype_legacy_hold';
        await prisma.sofEvent.upsert({
          where: {
            id: `seed-lt-${serial}-sof-ev-${leSerial}`
          },
          update: {
            statementId: ltStatement.id,
            eventTypeId: ltEventTypeId,
            eventTime: leTime,
            durationHours: null,
            durationMinutes: le === 0 ? null : 60,
            countsAsLaytime: le !== 2,
            isHold: le === 2,
            holdReason: le === 2 ? 'Queue at ghat' : null,
            createdBy: user.id,
            remarks: `Seed lighter SOF event ${leSerial}.`
          },
          create: {
            id: `seed-lt-${serial}-sof-ev-${leSerial}`,
            statementId: ltStatement.id,
            eventTypeId: ltEventTypeId,
            eventTime: leTime,
            durationHours: null,
            durationMinutes: le === 0 ? undefined : 60,
            countsAsLaytime: le !== 2,
            createdBy: user.id,
            remarks: `Seed lighter SOF event ${leSerial}.`,
            supportingDocuments: [],
            isHold: le === 2,
            holdReason: le === 2 ? 'Queue at ghat' : undefined
          }
        });
      }
    }
  }

  const seedSofRoles: AppRole[] = [
    AppRole.OPERATIONS_MANAGER,
    AppRole.MOTHER_VESSEL_ADMIN,
    AppRole.LIGHTER_ASSIGNMENT_OFFICER
  ];
  const roleRows = users.flatMap((u) =>
    seedSofRoles.map((role) => ({ userId: u.id, role }))
  );
  await prisma.userRoleAssignment.createMany({
    data: roleRows,
    skipDuplicates: true
  });
  await prisma.userRoleAssignment.createMany({
    data: [{ userId: users[0]!.id, role: AppRole.SUPER_ADMIN }],
    skipDuplicates: true
  });

  /** Primary demo super admin (phone login). */
  const superAdminPhone = '01329671919';
  const superAdminName = 'Abdur Rouf';
  const superAdminPassword = 'b1603119';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 12);
  const superAdminUser = await prisma.user.upsert({
    where: { phone: superAdminPhone },
    update: {
      fullName: superAdminName,
      passwordHash: superAdminHash,
      isActive: true,
      deletedAt: null,
      email: null
    },
    create: {
      phone: superAdminPhone,
      fullName: superAdminName,
      email: null,
      passwordHash: superAdminHash,
      isActive: true
    },
    select: { id: true, phone: true }
  });
  await prisma.userRoleAssignment.createMany({
    data: [{ userId: superAdminUser.id, role: AppRole.SUPER_ADMIN }],
    skipDuplicates: true
  });
  console.log(
    `Super admin seeded — sign in with phone ${superAdminUser.phone} (full name: ${superAdminName}). Password is set from seed script.`
  );

  console.log(`Demo login (includes SUPER_ADMIN): ${users[0]!.email} / ${demoLoginPassword}`);
  console.log(
    `Assigned SOF-capable roles (${seedSofRoles.join(', ')}) to ${users.length} seeded operator users.`
  );

  console.log('Seeded SOF demo data');
  console.log(`Organizations: ${organizations.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Locations: ${seededLocations.length}`);
  console.log(`Anchorages: ${anchorages.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Vessels: ${vessels.length}`);
  console.log(`Vessel calls: ${vesselCalls.length}`);
  console.log(`Statements of facts: ${statements.length}`);
  console.log(`SOF events: ${statements.length * MOTHER_SEED_EVENT_TYPE_IDS.length}`);
  console.log(`Daily discharges: ${vesselCalls.length}`);
  console.log(`Lighter trips: ${lighterTrips.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
