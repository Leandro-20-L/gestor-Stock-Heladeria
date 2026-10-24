import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsMongoId,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DescuentoStockDto {
  @IsMongoId()
  productoId: string;

  // Permite descontar fracciones (ej: 0.25 kg) además de unidades enteras
  @IsNumber()
  @Min(0.001)
  cantidad: number;
}

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsIn(['producto', 'insumo'])
  tipo?: 'producto' | 'insumo';

  @IsIn(['helado', 'bebida', 'comida', 'descartable', 'materia_prima'])
  categoria: 'helado' | 'bebida' | 'comida' | 'descartable' | 'materia_prima';

  // Opcional para que no falle al crear un insumo sin precio de venta
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVenta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsNumber()
  @Min(0)
  stockActual: number;

  @IsNumber()
  @Min(0)
  stockMinimo: number;

  @IsIn(['kg', 'unidad', 'litro'])
  unidad: 'kg' | 'unidad' | 'litro';

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioPoint?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescuentoStockDto)
  descuentaStock?: DescuentoStockDto[];
}