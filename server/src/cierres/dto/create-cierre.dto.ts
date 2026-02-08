import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CierreItemInputDto {
  @IsMongoId()
  productoId: string;

  @IsInt()
  @Min(0)
  stockContado: number;
}

export class CreateCierreDto {
  @IsString()
  fecha: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsMongoId()
  usuarioId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CierreItemInputDto)
  items: CierreItemInputDto[];

  @IsNumber()
  @Min(0)
  totalCajaContada: number;
}
