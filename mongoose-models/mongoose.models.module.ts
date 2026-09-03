// @ts-expect-error The dependency is provided by the application's NestJS setup.
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';


// Purpose: Centralized module to manage all Mongoose models and schemas to avoid circular dependencies

@Module({
  imports: [
    MongooseModule.forFeature([
      // All database models and schemas go here

      // e.g { name: DatabaseModelNames.USER, schema: UserSchema },

    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseModelsModule {}
