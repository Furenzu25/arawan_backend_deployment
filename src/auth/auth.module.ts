import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth.guard';
import { validateEnv } from '../config/app.config';
import { fetchSupabasePublicKey } from './jwks';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => {
        const env = validateEnv();
        const jwksUrl = `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;

        try {
          const publicKey = await fetchSupabasePublicKey(jwksUrl);
          return {
            publicKey,
            verifyOptions: { algorithms: ['ES256'] as const },
          };
        } catch {
          Logger.warn(
            'Could not fetch JWKS; falling back to HMAC secret',
            'AuthModule',
          );
          return {
            secret: env.SUPABASE_JWT_SECRET,
            verifyOptions: { algorithms: ['HS256'] as const },
          };
        }
      },
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
  exports: [JwtModule],
})
export class AuthModule {}
