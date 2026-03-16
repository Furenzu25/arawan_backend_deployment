import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { slugify, getProfilePhotoPath } from '../common/utils/storage.util';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get sb() {
    return this.supabaseService.getClient();
  }

  async findAll(simple: boolean) {
    if (simple) {
      const { data } = await this.sb
        .from('customers')
        .select('id, full_name')
        .order('full_name');
      return data ?? [];
    }

    const { data } = await this.sb
      .from('customers')
      .select('*, loans(id, status, total_payable)')
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  async findOne(id: string) {
    const [{ data: customer }, { data: loans }] = await Promise.all([
      this.sb.from('customers').select('*').eq('id', id).single(),
      this.sb
        .from('loans')
        .select('*, payments(id, day_number, status, amount_due, amount_paid, due_date, paid_date)')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),
    ]);

    return { customer, loans: loans ?? [] };
  }

  async create(dto: CreateCustomerDto, photoFile?: Express.Multer.File) {
    let profilePhotoUrl: string | null = null;

    if (photoFile) {
      const ext = photoFile.originalname.split('.').pop() ?? 'jpg';
      const slug = slugify(dto.full_name);
      const path = getProfilePhotoPath(slug, null, ext, Date.now());
      const { error: uploadError } = await this.sb.storage
        .from('arawan')
        .upload(path, photoFile.buffer, { contentType: photoFile.mimetype });
      if (uploadError) throw new InternalServerErrorException('Failed to upload photo');
      profilePhotoUrl = this.sb.storage.from('arawan').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await this.sb.from('customers').insert({
      ...dto,
      profile_photo_url: profilePhotoUrl,
    });

    if (error) throw new InternalServerErrorException('Failed to add customer');
    return { success: true };
  }

  async update(id: string, dto: UpdateCustomerDto, photoFile?: Express.Multer.File) {
    let profilePhotoUrl = dto.existing_photo_url ?? null;

    if (photoFile) {
      const ext = photoFile.originalname.split('.').pop() ?? 'jpg';
      const slug = slugify(dto.full_name);
      const path = getProfilePhotoPath(slug, id, ext);
      const { error: uploadError } = await this.sb.storage
        .from('arawan')
        .upload(path, photoFile.buffer, { contentType: photoFile.mimetype });
      if (uploadError) throw new InternalServerErrorException('Failed to upload photo');
      profilePhotoUrl = this.sb.storage.from('arawan').getPublicUrl(path).data.publicUrl;
    }

    const { existing_photo_url: _, ...fields } = dto;
    const { error } = await this.sb
      .from('customers')
      .update({ ...fields, profile_photo_url: profilePhotoUrl })
      .eq('id', id);

    if (error) throw new InternalServerErrorException('Failed to update customer');
    return { success: true };
  }
}
