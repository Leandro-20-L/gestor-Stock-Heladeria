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
  fecha: string;

  @IsOptional()
  @IsMongoId()
  usuarioId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CierreItemInputDto)
  items?: CierreItemInputDto[];

  @IsNumber()
  @Min(0)
  totalCajaContada: number;

  @IsNumber()
  @Min(0)
  totalVentasTeorico: number;

  @IsNumber()
  @Min(0)
  totalEfectivoSistema: number;

  @IsNumber()
  @Min(0)
  totalTransferenciaSistema: number;

  @IsNumber()
  @Min(0)
  totalPointSistema: number;

  @IsNumber()
  @Min(0)
  efectivoContado: number;

  @IsNumber()
  diferenciaEfectivo: number;

  @IsNumber()
  diferenciaCaja: number;
}
