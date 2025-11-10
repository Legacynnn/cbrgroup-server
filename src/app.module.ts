import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FurnitureModule } from './fornitures/fornitures.module';
import { ShowroomModule } from './showroom/showroom.module';
import { QuotesModule } from './quotes/quotes.module';
import { BrandsModule } from './brands/brands.module';
import { ContactsModule } from './contacts/contacts.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    FurnitureModule,
    ShowroomModule,
    QuotesModule,
    BrandsModule,
    ContactsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}