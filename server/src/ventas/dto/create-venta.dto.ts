import {
  IsArray,
  IsEnum,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MedioPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  POINT = 'point',
}

class VentaItemDto {
  @IsMongoId()
  productoId: string;

  @Min(1)
  cantidad: number;
}

export class CreateVentaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items: VentaItemDto[];

  @IsEnum(MedioPago)
  medioPago: MedioPago;
}
