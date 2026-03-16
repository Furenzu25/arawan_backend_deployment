import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.buildResponse(exception, request);
    response.status(status).json(body);
  }

  private buildResponse(exception: unknown, request: Request) {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();
      const message =
        typeof exResponse === 'string'
          ? exResponse
          : (exResponse as Record<string, unknown>).message ?? exception.message;

      this.logger.warn(`${request.method} ${request.url} ${status}`);

      return {
        status,
        body: { statusCode: status, error: message },
      };
    }

    this.logger.error(
      `${request.method} ${request.url} 500`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: this.isProduction
          ? 'Internal server error'
          : (exception instanceof Error ? exception.message : 'Unknown error'),
      },
    };
  }
}
