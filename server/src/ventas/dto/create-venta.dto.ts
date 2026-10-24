import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MedioPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  POINT = 'point',
}

export class AgregadoVentaDto {
  @IsMongoId()
  productoId: string;

  @IsNumber()
  @Min(0.001)
  cantidad: number;
}

export class VentaItemDto {
  @IsMongoId()
  productoId: string;

  @IsNumber()
  @Min(1)
  cantidad: number;

  // 1. Recargo en $ si el agregado suma al precio (ej: doble carne)
  @IsOptional()
  @IsNumber()
  @Min(0)
  recargoUnitario?: number;

  // 2. IDs de insumos de la receta original que NO se descuentan (ej: "Sin papas")
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  insumosExcluidos?: string[];

  // 3. Lista de insumos extra sumados al producto
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgregadoVentaDto)
  agregados?: AgregadoVentaDto[];

  // 4. Texto resumen para el historial (ej: "Sin: Papas | Extra: +1 Medallón")
  @IsOptional()
  @IsString()
  notaModificadores?: string;
}

export class CreateVentaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items: VentaItemDto[];

  @IsEnum(MedioPago)
  medioPago: MedioPago;
}