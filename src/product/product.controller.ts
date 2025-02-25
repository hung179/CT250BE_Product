import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Get,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { SAN_PHAM } from './schema/product.schema';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RedisService } from '../redis/redis.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly redisService: RedisService
  ) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'anhBia_SP', maxCount: 1 }, // Ảnh bìa (chỉ 1 ảnh)
      { name: 'anh_SP', maxCount: 9 }, // Nhận tối đa 4 ảnh sản phẩm
      { name: 'anh_TC', maxCount: 10 }, // Nhận tối đa 10 ảnh tùy chọn
    ])
  )
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      anhBia_SP?: Express.Multer.File[];
      anh_SP?: Express.Multer.File[];
      anh_TC?: Express.Multer.File[];
    }
  ): Promise<any> {
    return this.productService.createProduct(
      createProductDto,
      files.anh_SP || [],
      files.anh_TC || [],
      files.anhBia_SP?.[0] || ({} as Express.Multer.File)
    );
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'anhBiaCapNhat_SP', maxCount: 1 },
      { name: 'anhMoi_SP', maxCount: 9 },
      { name: 'anhMoi_TC', maxCount: 10 },
      { name: 'anhCapNhat_SP', maxCount: 4 },
      { name: 'anhCapNhat_TC', maxCount: 10 },
    ])
  )
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      anhBiaCapNhat_SP?: Express.Multer.File[];
      anhMoi_SP?: Express.Multer.File[];
      anhMoi_TC?: Express.Multer.File[];
      anhCapNhat_SP?: Express.Multer.File[];
      anhCapNhat_TC?: Express.Multer.File[];
    }
  ): Promise<SAN_PHAM> {
    return this.productService.updateProduct(id, updateProductDto, {
      anhBiaCapNhat_SP: files.anhBiaCapNhat_SP?.[0],
      anhMoi_SP: files.anhMoi_SP,
      anhMoi_TC: files.anhMoi_TC,
      anhCapNhat_SP: files.anhCapNhat_SP,
      anhCapNhat_TC: files.anhCapNhat_TC,
    });
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productService.deleteProduct(id);
  }

  @Get()
  async getProducts(
    @Query('p') page: number = 0,
    @Query('c') categoryId: string = '',
    @Query('l') limit: number = 12
  ) {
    if (categoryId) {
      return this.productService.getProductsByCategory(page, categoryId, limit);
    }
    return this.productService.getProducts(page, limit);
  }

  @Get('search')
  async searchProducts(
    @Query('k') searchKey: string,
    @Query('c') productId: number,
    @Query('l') limit: number = 12
  ) {
    if (searchKey) {
      return this.productService.getProductBySearchKey(searchKey, limit);
    } else if (productId) {
      return this.productService.getProductByCode(productId, limit);
    }
  }

  @Get('order/:id')
  async getSalesInf(@Param('id') idSalesInf: string) {
    return this.productService.getProductSalesInf(idSalesInf);
  }

  @Get(':id')
  async getProduct(
    @Param('id') id: string,
    @Query('searchKey') searchKey: string,
    @Query('code') code: number,
    @Query('l') limit: number = 12,
    @Query('p') page: number = 0
  ) {
    if (id) {
      return this.productService.getProductById(id, page, limit);
    } else if (searchKey) {
      return this.productService.getProductBySearchKey(searchKey, limit);
    } else if (code) {
      return this.productService.getProductByCode(code, limit);
    }
  }

  @MessagePattern('giam_kho_san_pham')
  async giamKhoHang(
    @Payload()
    payload: {
      ttSanPham: {
        idSanPham_CTHD: string;
        idTTBanHang_CTHD: string;
        soLuong_CTHD: number;
        giaMua_CTHD: number;
      }[];
    }
  ) {
    return this.productService.capNhatKhoHang(payload.ttSanPham);
  }

  @MessagePattern('hoan_kho_san_pham')
  hoanKhoHang(
    @Payload()
    payload: {
      ttSanPham: {
        idSanPham_CTHD: string;
        idTTBanHang_CTHD: string;
        soLuong_CTHD: number;
        giaMua_CTHD: number;
      }[];
    }
  ) {
    return this.productService.capNhatKhoHang(payload.ttSanPham, true);
  }

  @MessagePattern('test2')
  test(
    @Payload()
    payload: {
      data: string;
    }
  ) {
    return payload.data;
  }
}
