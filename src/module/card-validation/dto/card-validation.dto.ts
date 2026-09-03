import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CardValidationResultDto {
    @ApiProperty({ description: 'Whether the card number passed all validation checks.', example: true })
    valid!: boolean;

    @ApiProperty({
        description: 'The card network detected from the number, if recognisable.',
        example: 'Visa',
    })
    cardType!: string;
}

export class ValidateCardDto {
  @ApiProperty({
    description: 'The card number to validate. Spaces and hyphens are allowed as separators.',
    example: '4111 1111 1111 1111',
  })
  @IsString()
  @IsNotEmpty()
  cardNumber!: string;
}