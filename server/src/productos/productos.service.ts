import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Producto, ProductoDocument } from './schemas/producto.schema';
import mongoose, { Model } from 'mongoose';

type ProductoFindFilter = Parameters<Model<ProductoDocument>['find']>[0];

@Injectable()
export class ProductosService {
  constructor(
    @InjectModel(Producto.name)
    private readonly productoModel: Model<ProductoDocument>,
  ) {}
  create(dto: CreateProductoDto) {
    return this.productoModel.create({ ...dto, activo: true });
  }

  async findAll(params?: {
    categoria?: string;
    q?: string;
    activos?: string;
    stockBajo?: string;
  }) {
    const filter = {} as ProductoFindFilter;

    if (params?.categoria) (filter as any).categoria = params.categoria;
    if (params?.q) (filter as any).nombre = { $regex: params.q, $options: 'i' };

    if (params?.activos !== 'false') (filter as any).activo = true;

    if (params?.stockBajo === 'true') {
      (filter as any).$expr = { $lte: ['$stockActual', '$stockMinimo'] };
    }

    const productos = await this.productoModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return productos.map((p) => ({
      ...p,
      stockBajo: p.stockActual <= p.stockMinimo,
    }));
  }

  async findOne(id: string) {
    const prod = await this.productoModel.findById(id).exec();
    if (!prod) throw new NotFoundException('Producto no encontrado');
    return prod;
  }

  async update(id: string, dto: UpdateProductoDto) {
    const updated = await this.productoModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Producto no encontrado');
    return updated;
  }

  async remove(id: string) {
    const updated = await this.productoModel
      .findByIdAndUpdate(id, { activo: false }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Producto no encontrado');
    return { message: 'Producto desactivado', id };
  }

  async findStockBajo() {
    return this.findAll({ stockBajo: 'true' });
  }

  esStockBajo(producto: Pick<Producto, 'stockActual' | 'stockMinimo'>) {
    return producto.stockActual <= producto.stockMinimo;
  }
}
