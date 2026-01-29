import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash: hash,
    });

    const access_token = this.signToken(user.id, user.email);

    return {
      access_token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException();

    return this.signToken(user.id, user.email);
  }

  private signToken(id: string, email: string) {
    return {
      access_token: this.jwtService.sign({ sub: id, email }),
    };
  }
}
