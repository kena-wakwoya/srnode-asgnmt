import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureHttp } from './configure-http';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  configureHttp(app);
  setupSwagger(app);

  const port = Number(process.env.PORT ?? 8000);
  await app.listen(port);
}

void bootstrap();
