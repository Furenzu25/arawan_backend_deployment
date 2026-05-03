import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IDEMPOTENCY_TTL_MS } from '../../config/constants';

interface CachedEntry {
  status: 'pending' | 'done';
  body?: unknown;
  statusCode?: number;
  expiresAt: number;
}

const store = new Map<string, CachedEntry>();

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const key = request.headers['idempotency-key'] as string | undefined;
    if (!key) return true;

    evictExpired();

    const existing = store.get(key);

    if (existing?.status === 'pending') {
      throw new ConflictException('Duplicate request is still being processed');
    }

    if (existing?.status === 'done') {
      response.status(existing.statusCode ?? 200).json(existing.body);
      return false;
    }

    const entry: CachedEntry = {
      status: 'pending',
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    };
    store.set(key, entry);

    const originalJson = response.json.bind(response);
    response.json = (body?: unknown) => {
      entry.status = 'done';
      entry.body = body;
      entry.statusCode = response.statusCode;
      return originalJson(body);
    };

    response.on('close', () => {
      if (entry.status === 'pending') {
        store.delete(key);
        this.logger.warn(`Request closed before completion, key=${key}`);
      }
    });

    return true;
  }
}
