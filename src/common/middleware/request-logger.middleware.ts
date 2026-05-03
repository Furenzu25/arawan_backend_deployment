import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

      if (res.statusCode >= 500) {
        this.logger.error(message, undefined, req.id);
      } else if (res.statusCode >= 400) {
        this.logger.warn(`${message} [${req.id}]`);
      } else {
        this.logger.log(`${message} [${req.id}]`);
      }
    });

    next();
  }
}
