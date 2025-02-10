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

const limit = 2; // Số lượng sản phẩm trên mỗi trang

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'anhBia_SP', maxCount: 1 }, // Ảnh bìa (chỉ 1 ảnh)
      { name: 'anh_SP', maxCount: 4 }, // Nhận tối đa 4 ảnh sản phẩm
      { name: 'anh_TC', maxCount: 10 }, // Nhận tối đa 10 ảnh tùy chọn
    ])
  )
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      anhBia_SP?: Express.Multer.File[]; // 🟢 Sử dụng array vì Multer lưu file trong mảng
      anh_SP?: Express.Multer.File[];
      anh_TC?: Express.Multer.File[];
    }
  ): Promise<any> {
    console.log(createProductDto, files);
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
    console.log(updateProductDto, files);
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

  @Get('search')
  async searchProducts(
    @Query('k') searchKey: string,
    @Query('c') productId: number
  ) {
    if (searchKey) {
      return this.productService.getProductBySearchKey(searchKey, limit);
    } else if (productId) {
      return this.productService.getProductByCode(productId, limit);
    }
  }

  @Get('all')
  async getProducts(
    @Query('p') page: number = 0,
    @Query('c') categoryId: string = ''
  ) {
    if (categoryId) {
      return this.productService.getProductsByCategory(page, categoryId, limit);
    }
    return this.productService.getProducts(page, limit);
  }

  @Get(':id')
  async getProductById(
    @Param('id') id: string,
    @Query('searchKey') searchKey: string,
    @Query('code') code: number
  ) {
    if (id) {
      return this.productService.getProductById(id);
    } else if (searchKey) {
      return this.productService.getProductBySearchKey(searchKey, limit);
    } else if (code) {
      return this.productService.getProductByCode(code, limit);
    }
  }
}
