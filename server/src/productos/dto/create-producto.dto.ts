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

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsIn(['helado', 'bebida', 'comida'])
  categoria: 'helado' | 'bebida' | 'comida';

  @IsNumber()
  @Min(0)
  precioVenta: number;

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

  @IsIn(['kg', 'unidad'])
  unidad: 'kg' | 'unidad';

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

class DescuentoStockDto {
  @IsMongoId()
  productoId: string;

  @IsNumber()
  @Min(1)
  cantidad: number;
}
