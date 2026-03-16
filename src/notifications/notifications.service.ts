import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get sb() {
    return this.supabaseService.getClient();
  }

  async findAll() {
    const { data } = await this.sb
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    return data ?? [];
  }

  async markRead(id: string) {
    await this.sb.from('notifications').update({ is_read: true }).eq('id', id);
    return { success: true };
  }

  async markAllRead() {
    await this.sb.from('notifications').update({ is_read: true }).eq('is_read', false);
    return { success: true };
  }
}
