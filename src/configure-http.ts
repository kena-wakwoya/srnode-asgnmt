import { INestApplication } from '@nestjs/common';
import { AppExceptionFilter } from './common/http/app-exception.filter';
import { requestIdMiddleware } from './common/http/request-id.middleware';

export function configureHttp(app: INestApplication): void {
  app.use(requestIdMiddleware);
  app.useGlobalFilters(new AppExceptionFilter());
}
