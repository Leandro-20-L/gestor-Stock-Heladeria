import { Module } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Venta } from './entities/venta.entity';
import {
  Producto,
  ProductoSchema,
} from 'src/productos/schemas/producto.schema';
import { VentaSchema } from './schemas/venta.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Venta.name, schema: VentaSchema },
      { name: Producto.name, schema: ProductoSchema }, // para descontar stock
    ]),
  ],

  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
