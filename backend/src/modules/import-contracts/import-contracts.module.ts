import { Module } from "@nestjs/common";

import { ImportContractsController } from "./import-contracts.controller";
import { ImportContractsService } from "./import-contracts.service";

@Module({
  controllers: [ImportContractsController],
  providers: [ImportContractsService]
})
export class ImportContractsModule {}
