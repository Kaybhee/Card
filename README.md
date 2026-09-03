# Card Number Validation API

A backend intern assessment project: a single endpoint that determines whether a
submitted card number is structurally valid.

## Contents

- [Quick start](#quick-start)
- [The endpoint](#the-endpoint)
- [How validity is determined](#how-validity-is-determined)
- [Design decisions](#design-decisions)
- [Project architecture](#project-architecture) - a tour of every module in the codebase
- [Testing](#testing)

## Quick start

**Requirements:** Node.js 20+, npm.

```bash
# 1. Install dependencies
npm install

# 4. Run the app
npm run start:dev
```

The API is now running on `http://localhost:3000`. Swagger docs are available at
`http://localhost:3000/api`.

```bash
curl -X POST http://localhost:3000/card-validation/validate \
  -H "Content-Type: application/json" \
  -d '{"cardNumber": "4111 1111 1111 1111"}'
```

## The endpoint

```
POST /card-validation/validate
Content-Type: application/json

{ "cardNumber": "4111 1111 1111 1111" }
```

**200 OK** - request was well-formed enough to evaluate:

```json
{ "success": true, "valid": true, "cardType": "Visa" }
```

`valid: false` is still a 200 - the request was fine, the card number just didn't
pass validation. A 4xx status is reserved for problems with the request itself.

**422 Unprocessable Entity** - `cardNumber` is missing, not a string, or empty
(caught by the DTO's `class-validator` decorators and the app's existing
`ValidationExceptionFilter`):

```json
{ "error": 422, "message": "cardNumber should not be empty" }
```

**400 Bad Request** - `cardNumber` is a non-empty string but isn't a plausible card
number (contains letters, or is an implausible length), via
`BadRequestException.VALIDATION_ERROR` and the app's existing
`BadRequestExceptionFilter`:

```json
{ "code": 422, "message": "Card number must contain only digits, spaces, or hyphens.", "success": false }
```

## How validity is determined

Actually confirming a card is real, open, and funded requires talking to a payment
network or the issuing bank - well outside the scope of this assessment. What this
endpoint checks instead is the same structural validation card issuers run before a
card number ever reaches that stage:

1. **Format** - strip spaces/hyphens, then reject anything that isn't purely digits.
2. **Length** - reject anything shorter than 12 or longer than 19 digits (the range
   real card numbers fall into, per ISO/IEC 7812).
3. **Luhn checksum** - the standard check-digit algorithm
   ([ISO/IEC 7812-1](https://en.wikipedia.org/wiki/Luhn_algorithm))

A `cardType` (Visa, Mastercard, American Express, Discover, or
`Unknown`) is also detected from the number's prefix. This doesn't affect validity -
an unrecognised prefix isn't an error, it's just a network this endpoint doesn't
know about - but it makes the response more useful and was a natural, low-cost
extension of logic the validator already needed (it's already looking at the leading digits to sanity-check the input).

## Design decisions

- **Format vs. content, as two different failure modes.** A missing or non-string
  `cardNumber` is a 422 (the request doesn't match the contract). A present,
  string `cardNumber` that isn't plausibly a card number (letters, wrong length) is a
  400 (the request is shaped correctly but the content is invalid). This mirrors the
  distinction the existing filters (`ValidationExceptionFilter` vs.
  `BadRequestExceptionFilter`) already draw elsewhere in the app, so the new endpoint
  behaves consistently with the rest of the API rather than inventing its own
  error convention.
- **A failed Luhn check is a 200, not an error.** "Is this card number valid?" has a
  real, meaningful answer of "no" - that's not a server or client error, it's the
  result the caller asked for.
- **The card number is never echoed back in the response.** The caller already knows
  what they sent; there's no reason for this service to repeat it, and doing so
  would mean it shows up again in response logs, client state, etc. for no benefit.
- **No persistence.** Nothing about a validation request needs to be remembered
  between calls, so `CardValidationModule` doesn't touch `RepositoryModule` or
  `MongooseModelsModule` at all, even though both are available in the project.
- **Luhn and card-type detection are standalone functions**, not private methods on
  the service, so they can be unit-tested directly without spinning up Nest's DI
  container for pure logic that doesn't need it.

## Project architecture

This project is built on an internal starter that i have created.
Below is what each part of it does - both the pieces this assessment's feature uses
directly, and the ones it deliberately doesn't.

### `src/app.module.ts` / `src/main.ts`

The application root. Wires together global configuration, the MongoDB connection, global validation, and the global exception filters, then every
feature module gets added to the `imports` array (`CardValidationModule` is the only
addition made for this assessment). `main.ts` bootstraps the Nest app, applies a
second global `ValidationPipe`, and sets up Swagger at `/api`.

### `src/config/`

Environment-driven configuration, split by `NODE_ENV` (`development.ts` /
`production.ts`) and merged in `index.ts`. Both currently expose the same shape:
MongoDB connection string, JWT settings, and Cloudinary credentials.
Nothing here was added or changed for the card-validation feature.


### `src/modules/card-validation/` (`CardValidationModule`) - added for this assessment

The feature itself:

- `card-validation.controller.ts` - the `POST /card-validation/validate` route.
- `card-validation.service.ts` - the validation logic and its error cases.
- `dto/validate-card.dto.ts` - request shape and structural validation
  (`class-validator`).
- `dto/card-validation-result.dto.ts` - response shape.
- `utils/luhn.util.ts` - the Luhn checksum, as a pure function.
- `utils/card-type.util.ts` - card network detection from prefix, as a pure function.

### `src/exceptions/` and `src/filters/`

A consistent error-handling convention used across the whole app:

- Each exception class (`BadRequestException`, `UnauthorizedException`,
  `ForbiddenException`, `InternalServerErrorException`) extends `HttpException`,
  carries a `code`/`message`/`description`, and exposes static factory methods
  (e.g. `BadRequestException.VALIDATION_ERROR(...)`) instead of callers constructing
  raw instances.
- `exceptions.constants.ts` centralises the numeric codes behind those factories.
- A matching filter for each exception type (`src/filters/`) is registered globally
  in `AppModule` (as `APP_FILTER` providers) and converts the exception into a
  consistent JSON response shape.
- `AllExceptionsFilter` is the catch-all fallback for anything that isn't one of the
  typed exceptions above.
- `ValidationExceptionFilter` specifically catches `class-validator`'s
  `ValidationError` (thrown by the global `ValidationPipe`'s `exceptionFactory` in
  `app.module.ts`) and turns it into a 422 response.
- `MongoExceptionFilter` catches raw MongoDB driver errors (e.g. duplicate-key
  errors) and is registered directly in `main.ts` rather than via `APP_FILTER`.

`card-validation.service.ts` reuses this existing convention
(`BadRequestException.VALIDATION_ERROR(...)`) for its malformed-input case rather
than introducing a new error shape.

### `src/shared/`

- `enums/` - `NodeEnv` (`development`/`production`) and `LogLevel`, used by
  configuration; `db.enum.ts` is currently empty, presumably reserved for database
  model-name constants once schemas exist.
- `types/schema.type.ts` - an `Identifier` type (`Types.ObjectId | string`) intended
  for use in Mongoose document types.

None of `src/shared/` is used by the card-validation feature, which has no database
identifiers to type.

## Testing

```bash
npm test              # unit tests
npm run test:e2e      # integration/e2e tests
```

**Unit tests** (`src/modules/card-validation/`):

- `utils/luhn.util.spec.ts` - the checksum in isolation.
- `utils/card-type.util.spec.ts` - prefix-based network detection.
- `card-validation.service.spec.ts` - the service's decision logic and error cases.

**Integration test** (`test/card-validation.e2e-spec.ts`) boots only
`CardValidationModule` - not the full `AppModule` - and asserts against real HTTP
requests via `supertest`. It's deliberately isolated from `AppModule` so it doesn't
require a live MongoDB connection: the feature under test has no database
dependency, so the test suite shouldn't have one either. The global `ValidationPipe`
and the two relevant exception filters are applied manually in the test setup so
behaviour matches what `main.ts`/`app.module.ts` configure in production.
