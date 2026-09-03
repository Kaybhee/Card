import { Module } from "@nestjs/common";
import { CardValidatorService } from "./card-valid.service";
import { CardValidationController } from "./card-valid.controller";

@Module({
    controllers: [CardValidationController],
    providers: [CardValidatorService],
})

export class CardValidationModule {}