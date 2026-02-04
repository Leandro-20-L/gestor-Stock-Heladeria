import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

import { Usuario, UsuarioDocument } from './schemas/usuarios.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  findAll() {
    return this.usuarioModel
      .find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByEmail(email: string) {
    return this.usuarioModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
  }

  async create(dto: CreateUsuarioDto) {
    const email = dto.email.toLowerCase().trim();
    const existe = await this.usuarioModel.findOne({ email }).exec();
    if (existe) throw new BadRequestException('Email ya registrado');

    const passwordHash = await bcrypt.hash(String(dto.password), 10);

    const user = await this.usuarioModel.create({
      nombre: dto.nombre,
      email,
      passwordHash,
      rol: dto.rol,
      activo: true,
    });

    // sin delete (mejor)
    const { passwordHash: _passwordHash, ...rest } = user.toObject();
    void _passwordHash; // ✅ marca uso intencional
    return rest;
  }

  async setRol(id: string, rol: 'admin' | 'empleado') {
    const updated = await this.usuarioModel
      .findByIdAndUpdate(
        id,
        { rol },
        { new: true, projection: { passwordHash: 0 } },
      )
      .exec();

    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return updated;
  }

  async setActivo(id: string, activo: boolean) {
    const updated = await this.usuarioModel
      .findByIdAndUpdate(
        id,
        { activo },
        { new: true, projection: { passwordHash: 0 } },
      )
      .exec();

    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return updated;
  }
}
