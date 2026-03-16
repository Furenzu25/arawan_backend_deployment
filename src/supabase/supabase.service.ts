import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateEnv } from '../config/app.config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;

  onModuleInit() {
    const env = validateEnv();
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
