import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:3000',      
      'http://localhost:8000',      
      'https://cbrdesigngroup.com', 
      'https://www.cbrdesigngroup.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });
  
  await app.listen(process.env.PORT ?? 3333, process.env.HOST ?? '0.0.0.0');
}
bootstrap();