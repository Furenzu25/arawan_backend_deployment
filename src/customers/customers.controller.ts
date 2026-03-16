import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FILE_LIMITS } from '../config/constants';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query('simple') simple?: string) {
    return this.customersService.findAll(simple === 'true');
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: FILE_LIMITS.MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowed = FILE_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  create(
    @Body() dto: CreateCustomerDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.customersService.create(dto, photo);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: FILE_LIMITS.MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowed = FILE_LIMITS.ALLOWED_MIME_TYPES as readonly string[];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.customersService.update(id, dto, photo);
  }
}
