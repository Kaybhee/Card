import { Injectable } from "@nestjs/common";
import { CardValidationResultDto } from "./dto/card-validation.dto";
import { BadRequestException } from "src/exceptions";
import { detectCard } from "./utils/card-type.utils";
import { isValidLuhn } from "./utils/luhn.utils";

@Injectable()
export class CardValidatorService {
    MIN_CARD_LENGTH = 12;
    MAX_CARD_LENGTH = 19;

    validate(cardNumber: string): CardValidationResultDto {
        const digits = cardNumber.replace(/[\s-]/g, '');

        if (!/^\d+$/.test(digits)) {
        throw BadRequestException.VALIDATION_ERROR('Card number must contain only digits, spaces, or hyphens.');
        }

        if (digits.length < this.MIN_CARD_LENGTH || digits.length > this.MAX_CARD_LENGTH) {
        throw BadRequestException.VALIDATION_ERROR(
            `Card number must be between ${this.MIN_CARD_LENGTH} and ${this.MAX_CARD_LENGTH} digits long.`);
        }

        return {
            valid: isValidLuhn(digits),
            cardType: detectCard(digits),
        };
    }
}
