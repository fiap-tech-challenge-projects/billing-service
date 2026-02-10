import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Enable CORS
  app.enableCors()

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Billing Service API')
    .setDescription('Budget & Payment Management API')
    .setVersion('1.0')
    .addTag('Budgets')
    .addTag('Payments')
    .addTag('Health')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/v1/docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)

  console.log(`Application is running on: http://localhost:${port}`)
  console.log(`Swagger docs available at: http://localhost:${port}/api/v1/docs`)
}

bootstrap()
