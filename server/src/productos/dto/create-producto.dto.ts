import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
}
