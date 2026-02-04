import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/jwt/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id/rol')
  setRol(@Param('id') id: string, @Body() body: { rol: 'admin' | 'empleado' }) {
    return this.usuariosService.setRol(id, body.rol);
  }

  @Patch(':id/estado')
  setEstado(@Param('id') id: string, @Body() body: { activo: boolean }) {
    return this.usuariosService.setActivo(id, body.activo);
  }
}
