import { Controller, Get, Body, UseGuards, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/jwt/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('resumen')
  resumen(@Query('from') from?: string, @Query('to') to?: string) {
    return this.statsService.resumen({ from, to });
  }
}
