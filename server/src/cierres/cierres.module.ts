import { Module } from '@nestjs/common';
import { CierresService } from './cierres.service';
import { CierresController } from './cierres.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cierre } from './entities/cierre.entity';
import {
  Producto,
  ProductoSchema,
} from 'src/productos/schemas/producto.schema';
import { CierreSchema } from './schemas/cierre.schema';
import { Venta, VentaSchema } from 'src/ventas/schemas/venta.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cierre.name, schema: CierreSchema },
      { name: Producto.name, schema: ProductoSchema },
      { name: Venta.name, schema: VentaSchema },
    ]),
  ],
  controllers: [CierresController],
  providers: [CierresService],
})
export class CierresModule {}
