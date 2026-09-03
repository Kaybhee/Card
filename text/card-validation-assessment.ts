import { INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { expect } from '@jest/globals';
import { it } from '@jest/globals';
import request from 'supertest';
import { describe, beforeEach, afterEach } from '@jest/globals';
import { CardValidationModule } from 'src/module/card-validation/card-valid.module';
import { BadRequestExceptionFilter, ValidationExceptionFilter } from '../src/filters';


describe('CardValidationController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CardValidationModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        exceptionFactory: (errors: ValidationError[]) => errors[0],
      }),
    );

    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(
      new ValidationExceptionFilter(httpAdapterHost),
      new BadRequestExceptionFilter(httpAdapterHost),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 with valid: true for a well-formed card number', () => {
    return request(app.getHttpServer())
      .post('/card-validation/validate')
      .send({ cardNumber: '4111 1111 1111 1111' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ success: true, valid: true, cardType: 'Visa' });
      });
  });

  it('returns 200 with valid: false for a card number that fails the Luhn check', () => {
    return request(app.getHttpServer())
      .post('/card-validation/validate')
      .send({ cardNumber: '4111111111111112' })
      .expect(200)
      .expect((res) => {
        expect(res.body.valid).toBe(false);
      });
  });

  it('returns 422 when cardNumber is missing from the request body', () => {
    return request(app.getHttpServer()).post('/card-validation/validate').send({}).expect(422);
  });

  it('returns 400 when cardNumber contains non-digit characters', () => {
    return request(app.getHttpServer())
      .post('/card-validation/validate')
      .send({ cardNumber: 'not-a-card-number' })
      .expect(400);
  });
});
