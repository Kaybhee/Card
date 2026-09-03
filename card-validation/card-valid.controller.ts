import { Body, Controller, HttpCode, HttpStatus, Injectable, Post } from "@nestjs/common";
import { CardValidatorService } from "./card-valid.service";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CardValidationResultDto, ValidateCardDto } from "./dto/card-validation.dto";

@Injectable()
@ApiTags('Card Validation')
@Controller('card')
export class CardValidationController {
    constructor(private readonly cardValidationService: CardValidatorService) {}

    @Post('validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Validate a card'})
    @ApiBody({ type: ValidateCardDto })
    @ApiOkResponse({ type: CardValidationResultDto})
    validate(@Body() { cardNumber }: ValidateCardDto): { success: true } & CardValidationResultDto {
        const result = this.cardValidationService.validate(cardNumber);

        return { success: true, ...result}
    }
}