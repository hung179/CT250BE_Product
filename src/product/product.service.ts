import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SAN_PHAM, ProductDocument } from './schema/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; // Nhập CloudinaryService để xử lý ảnh

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(SAN_PHAM.name) private productModel: Model<ProductDocument>,
    private cloudinaryService: CloudinaryService // Tiêm CloudinaryService
  ) {}

  // Tạo mới sản phẩm
  async createProduct(
    dto: CreateProductDto,
    anh_SP: Express.Multer.File[],
    anh_TC: Express.Multer.File[]
  ): Promise<SAN_PHAM> {
    const product = await this.productModel.create(dto);

    const productImages = await this.cloudinaryService.uploadImages(
      product,
      anh_SP,
      anh_TC
    );

    // Cập nhật lại ảnh vào database
    product.anh_SP = productImages.anh_SP_uploaded;
    // Duyệt qua danh sách ảnh tùy chọn và cập nhật vào `phanLoai_SP`
    if (product.phanLoai_SP && productImages.anh_TC_uploaded.length > 0) {
      let index = 0; // Dùng biến index để duyệt qua `anh_TC_uploaded`

      product.phanLoai_SP.forEach((phanLoai) => {
        phanLoai.tuyChon_PL.forEach((tuyChon) => {
          if (
            tuyChon.coAnh_TC === true &&
            index < productImages.anh_TC_uploaded.length
          ) {
            tuyChon.anh_TC = productImages.anh_TC_uploaded[index]; // Gán ảnh theo thứ tự
            index++; // Tăng index để lấy ảnh tiếp theo
          }
        });
      });
    }
    return await product.save();
  }

  // Cập nhật sản phẩm
  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto
  ): Promise<SAN_PHAM> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      { new: true }
    );
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
  }

  // Xóa sản phẩm
  async deleteProduct(id: string): Promise<void> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    await this.cloudinaryService.deleteFolder(`Product/${id}`);

    // Xóa sản phẩm khỏi database
    await product.deleteOne();
  }

  // Lấy danh sách sản phẩm
  async getAllProducts(): Promise<SAN_PHAM[]> {
    return this.productModel.find().exec();
  }
}
