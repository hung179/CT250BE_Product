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
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { SAN_PHAM } from './schema/product.schema';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'anh_SP', maxCount: 5 }, // Nhận tối đa 5 ảnh sản phẩm
      { name: 'anh_TC', maxCount: 10 }, // Nhận tối đa 10 ảnh tùy chọn
    ])
  )
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: { anh_SP?: Express.Multer.File[]; anh_TC?: Express.Multer.File[] }
  ): Promise<any> {
    //console.log(createProductDto);
    return this.productService.createProduct(
      createProductDto,
      files.anh_SP || [],
      files.anh_TC || []
    );
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<SAN_PHAM> {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productService.deleteProduct(id);
  }

  @Get()
  async getProducts(): Promise<SAN_PHAM[]> {
    return this.productService.getAllProducts();
  }
}
