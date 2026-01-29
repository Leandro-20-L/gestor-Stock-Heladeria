import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CierresService } from './cierres.service';
import { CreateCierreDto } from './dto/create-cierre.dto';

@Controller('cierres')
export class CierresController {
  constructor(private readonly cierresService: CierresService) {}

  @Post()
  create(@Body() dto: CreateCierreDto) {
    return this.cierresService.create(dto);
  }

  @Get()
  findAll(@Query('fecha') fecha?: string) {
    return this.cierresService.findAll(fecha);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cierresService.findOne(id);
  }
}
