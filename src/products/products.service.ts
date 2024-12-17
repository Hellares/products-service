import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { CONSOLE_COLORS } from '../../colors.constants';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log(`${CONSOLE_COLORS.TEXT.MAGENTA}Connected to database 🆗`);
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll( paginationDto: PaginationDto) {

    const { page, limit } = paginationDto;
    const items = await this.product.count( { where: { available: true } });
    const totalPages = Math.ceil(items / limit);

    return {
      data: await this. product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true },
      }),
      metadata:{
        items: items,
        page: page,
        totalPages: totalPages,
      }
    }
 
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true },
    });

    if (!product) {
      throw new RpcException({
        message: `Producto con id #${id} no encontrado`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto; // omite el id

    await this.findOne(id);

    return this.product.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: number) {

    await this.findOne(id);

    const product = await this.product.update({
      where: { id },
      data: { available: false },
    });

    return product;
  }

  async validateProducts(ids: number[]) {
    
    ids = Array.from(new Set(ids));
    const products = await this.product.findMany({
      where: { 
        id: { 
          in: ids 
        }, 
        // available: true },
      },
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        message: `No se encontro los productos`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return products;
  }
}
