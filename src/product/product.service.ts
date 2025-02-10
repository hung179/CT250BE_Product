/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SAN_PHAM, ProductDocument } from './schema/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; // Nhập CloudinaryService để xử lý ảnh
import { DeletedProductCodeService } from './deletedProductCode/deletedProductCode.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(SAN_PHAM.name) private productModel: Model<ProductDocument>,
    private cloudinaryService: CloudinaryService, // Tiêm CloudinaryService
    private readonly deletedCodeService: DeletedProductCodeService
  ) {}

  // Tạo mới sản phẩm
  async createProduct(
    dto: CreateProductDto,
    anh_SP: Express.Multer.File[],
    anh_TC: Express.Multer.File[],
    anhBia_SP: Express.Multer.File
  ): Promise<SAN_PHAM> {
    const maxCode = await this.getMaxProductCode();
    const nextCode = await this.deletedCodeService.getNextProductCode(maxCode);
    const product = new this.productModel({ ...dto, ma_SP: nextCode });
    const productId = product._id as string;
    const productImageCover =
      await this.cloudinaryService.uploadProductImageCover(
        productId,
        anhBia_SP
      );
    const productImages = await this.cloudinaryService.uploadProductImages(
      productId,
      anh_SP
    );

    const idTuyChonCoAnh: string[] =
      product.phanLoai_SP
        ?.flatMap((pl) =>
          pl.tuyChon_PL
            .filter((tc) => tc.coAnh_TC === true)
            .map((tc: any) => tc._id?.toString())
        )
        ?.filter((id): id is string => !!id) || []; // Loại bỏ `undefined`

    const productOptionImages =
      await this.cloudinaryService.uploadProductOptionImages(
        productId,
        anh_TC,
        idTuyChonCoAnh
      );

    product.anh_SP = productImages.anh_SP_uploaded;
    product.anhBia_SP = productImageCover.anh_SP_uploaded;
    if (product.phanLoai_SP && productOptionImages.anh_TC_uploaded.length > 0) {
      let index = 0;
      product.phanLoai_SP.forEach((phanLoai) => {
        phanLoai.tuyChon_PL.forEach((tuyChon) => {
          if (
            tuyChon.coAnh_TC === true &&
            index < productOptionImages.anh_TC_uploaded.length
          ) {
            tuyChon.anh_TC = productOptionImages.anh_TC_uploaded[index];
            index++;
          }
        });
      });
    }
    return await product.save();
  }

  /////////////////////////////////////////////////////////////////////////////////Cập nhật sản phẩm
  // async updateProduct(
  //   id: string,
  //   updateProductDto: UpdateProductDto,
  //   files: {
  //     anhBiaCapNhat_SP: Express.Multer.File | undefined;
  //     anhMoi_SP: Express.Multer.File[] | undefined;
  //     anhMoi_TC: Express.Multer.File[] | undefined;
  //     anhCapNhat_SP: Express.Multer.File[] | undefined;
  //     anhCapNhat_TC: Express.Multer.File[] | undefined;
  //   }
  // ): Promise<SAN_PHAM> {
  //   // 1️⃣ Tìm sản phẩm cần cập nhật
  //   const product = await this.productModel.findById(id);
  //   if (!product) {
  //     throw new NotFoundException('Sản phẩm không tồn tại');
  //   }
  //   await this.productModel.updateOne({ _id: id }, { $set: updateProductDto });
  //   // 2️⃣ Cập nhật ảnh bìa
  //   if (files.anhBiaCapNhat_SP) {
  //     const productImageCover =
  //       await this.cloudinaryService.uploadProductImageCover(
  //         id,
  //         files.anhBiaCapNhat_SP
  //       );
  //     console.log('Anh Bia');
  //     console.log(productImageCover);
  //     product.anhBia_SP = productImageCover.anh_SP_uploaded;
  //   }

  //   // 3️⃣ Thêm ảnh sản phẩm
  //   if (files.anhMoi_SP) {
  //     const productImages = await this.cloudinaryService.uploadProductImages(
  //       id,
  //       files.anhMoi_SP
  //     );
  //     console.log('Anh SP thêm mới');
  //     console.log(productImages);
  //     product.anh_SP = [
  //       ...(product.anh_SP || []),
  //       ...productImages.anh_SP_uploaded,
  //     ];
  //   }

  //   // 4️⃣ Cập nhật ảnh sản phẩm
  //   if (updateProductDto.ttAnhCapNhat_SP) {
  //     if (
  //       files.anhCapNhat_SP &&
  //       files.anhCapNhat_SP.length === updateProductDto.ttAnhCapNhat_SP.length
  //     ) {
  //       const productImages = await this.cloudinaryService.updateImages(
  //         updateProductDto.ttAnhCapNhat_SP,
  //         files.anhCapNhat_SP
  //       );

  //       console.log('Anh SP cập nhật');
  //       console.log(productImages);
  //       // Cập nhật URL trong anh_SP nếu public_id trùng khớp
  //       product.anh_SP = (product.anh_SP ?? []).map((image) => {
  //         const updatedImage = productImages.find(
  //           (img) => img.public_id === image.public_id
  //         );
  //         return updatedImage ? { ...image, url: updatedImage.url } : image;
  //       });
  //     }
  //   }

  //   // 5️⃣ Thêm ảnh tùy chọn
  //   if (files.anhMoi_TC) {
  //     const idTuyChonCoAnh: string[] =
  //       product.phanLoai_SP
  //         ?.flatMap((pl) =>
  //           pl.tuyChon_PL
  //             .filter((tc) => tc.coAnh_TC === true && !tc.anh_TC)
  //             .map((tc) => (tc as any)._id?.toString())
  //         )
  //         ?.filter((id): id is string => !!id) || []; // Loại bỏ `undefined`

  //     console.log(idTuyChonCoAnh);
  //     const productOptionImages =
  //       await this.cloudinaryService.uploadProductOptionImages(
  //         id,
  //         files.anhMoi_TC,
  //         idTuyChonCoAnh
  //       );
  //     console.log('Anh TC them');
  //     console.log(productOptionImages);
  //     let index = 0;
  //     product.phanLoai_SP?.[0]?.tuyChon_PL.forEach((tuyChon) => {
  //       if (tuyChon.coAnh_TC === true && !tuyChon.anh_TC) {
  //         tuyChon.anh_TC = productOptionImages.anh_TC_uploaded[index];
  //         index++;
  //       }
  //     });
  //   }

  //   // 6️⃣ Cập nhật ảnh tùy chọn
  //   if (updateProductDto.ttAnhCapNhat_TC) {
  //     if (
  //       files.anhCapNhat_TC &&
  //       files.anhCapNhat_TC.length === updateProductDto.ttAnhCapNhat_TC.length
  //     ) {
  //       const productOptionImages = await this.cloudinaryService.updateImages(
  //         updateProductDto.ttAnhCapNhat_TC,
  //         files.anhCapNhat_TC
  //       );
  //       console.log('Anh TC cap nhat');
  //       console.log(productOptionImages);
  //       product.phanLoai_SP?.[0]?.tuyChon_PL.forEach((tuyChon) => {
  //         if (tuyChon.coAnh_TC === true && tuyChon.anh_TC) {
  //           const updatedImage = productOptionImages.find(
  //             (img) => img.public_id === tuyChon.anh_TC?.public_id
  //           );
  //           if (updatedImage) {
  //             tuyChon.anh_TC = updatedImage;
  //           }
  //         }
  //       });
  //     }
  //   }

  //   // 7️⃣ Cập nhật xóa ảnh sản phẩm
  //   if (updateProductDto.ttAnhXoa_SP) {
  //     await this.cloudinaryService.deleteImages(updateProductDto.ttAnhXoa_SP);
  //   }

  //   await product.save();
  //   return (await this.productModel.findById(id)) as SAN_PHAM;
  // }

  //Cập nhật sản phẩm
  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    files: {
      anhBiaCapNhat_SP: Express.Multer.File | undefined;
      anhMoi_SP: Express.Multer.File[] | undefined;
      anhMoi_TC: Express.Multer.File[] | undefined;
      anhCapNhat_SP: Express.Multer.File[] | undefined;
      anhCapNhat_TC: Express.Multer.File[] | undefined;
    }
  ): Promise<SAN_PHAM> {
    const updateData = { ...updateProductDto };
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    await this.productModel.findOneAndUpdate(
      { _id: id },
      { $set: updateProductDto },
      { new: true }
    );

    // Lấy lại dữ liệu mới nhất
    const updatedProduct = await this.productModel.findById(id);

    // Cập nhật ảnh
    await this.capNhatAnhBia(id, updatedProduct, files.anhBiaCapNhat_SP);
    await this.themAnhSanPham(id, updatedProduct, files.anhMoi_SP);
    await this.capNhatAnhSanPham(
      updatedProduct,
      updateData.ttAnhCapNhat_SP,
      files.anhCapNhat_SP
    );
    await this.themAnhTuyChon(id, updatedProduct, files.anhMoi_TC);
    await this.capNhatAnhTuyChon(
      updatedProduct,
      updateData.ttAnhCapNhat_TC,
      files.anhCapNhat_TC
    );
    await this.xoaAnhSanPham(updateData.ttAnhXoa_SP);
    await this.xoaAnhTuyChon(updateData.ttAnhXoa_TC);

    return (await this.productModel.findById(id)) as SAN_PHAM;
  }

  private async capNhatAnhBia(
    productId: string,
    product: any,
    file?: Express.Multer.File
  ) {
    if (!file) return;
    const productImageCover =
      await this.cloudinaryService.uploadProductImageCover(productId, file);
    product.anhBia_SP = productImageCover.anh_SP_uploaded;
    await product.save();
  }

  private async themAnhSanPham(
    productId: string,
    product: any,
    files?: Express.Multer.File[]
  ) {
    if (!files || files.length === 0) return;
    const productImages = await this.cloudinaryService.uploadProductImages(
      productId,
      files
    );
    product.anh_SP = [
      ...(product.anh_SP || []),
      ...productImages.anh_SP_uploaded,
    ];
    await product.save();
  }

  private async capNhatAnhSanPham(
    product: any,
    ttAnhCapNhat_SP?: string[],
    files?: Express.Multer.File[]
  ) {
    if (!ttAnhCapNhat_SP || !files || files.length !== ttAnhCapNhat_SP.length)
      return;
    const updatedImages = await this.cloudinaryService.updateImages(
      ttAnhCapNhat_SP,
      files
    );
    product.anh_SP = (product.anh_SP ?? []).map((image) => {
      const updatedImage = updatedImages.find(
        (img) => img.public_id === image.public_id
      );
      return updatedImage ? { ...image, url: updatedImage.url } : image;
    });
    await product.save();
  }

  private async themAnhTuyChon(
    productId: string,
    product: any,
    files?: Express.Multer.File[]
  ) {
    if (!files || files.length === 0) return;

    const idTuyChonCoAnh: string[] =
      product.phanLoai_SP
        ?.flatMap((pl) =>
          pl.tuyChon_PL
            .filter((tc) => tc.coAnh_TC === true && !tc.anh_TC)
            .map((tc: any) => tc._id?.toString())
        )
        ?.filter((id): id is string => !!id) || [];

    if (idTuyChonCoAnh.length === 0) return;

    const productOptionImages =
      await this.cloudinaryService.uploadProductOptionImages(
        productId,
        files,
        idTuyChonCoAnh
      );

    let index = 0;
    product.phanLoai_SP?.forEach((pl) => {
      pl.tuyChon_PL.forEach((tuyChon) => {
        if (tuyChon.coAnh_TC === true && !tuyChon.anh_TC) {
          tuyChon.anh_TC = productOptionImages.anh_TC_uploaded[index];
          index++;
        }
      });
    });

    await product.save();
  }

  private async capNhatAnhTuyChon(
    product: any,
    ttAnhCapNhat_TC?: string[],
    files?: Express.Multer.File[]
  ) {
    if (!ttAnhCapNhat_TC || !files || files.length !== ttAnhCapNhat_TC.length)
      return;

    const updatedImages = await this.cloudinaryService.updateImages(
      ttAnhCapNhat_TC,
      files
    );

    product.phanLoai_SP?.forEach((pl) => {
      pl.tuyChon_PL.forEach((tuyChon) => {
        if (tuyChon.coAnh_TC === true && tuyChon.anh_TC) {
          const updatedImage = updatedImages.find(
            (img) => img.public_id === tuyChon.anh_TC?.public_id
          );
          if (updatedImage) {
            tuyChon.anh_TC = updatedImage;
          }
        }
      });
    });

    await product.save();
  }

  private async xoaAnhSanPham(ttAnhXoa_SP?: string[]) {
    if (!ttAnhXoa_SP || ttAnhXoa_SP.length === 0) return;
    await this.cloudinaryService.deleteImages(ttAnhXoa_SP);
    await this.productModel.updateMany(
      {
        'anh_SP._id': { $in: ttAnhXoa_SP.map((id) => new Types.ObjectId(id)) },
      },
      {
        $pull: {
          anh_SP: {
            _id: { $in: ttAnhXoa_SP.map((id) => new Types.ObjectId(id)) },
          },
        },
      }
    );
  }

  private async xoaAnhTuyChon(ttAnhXoa_TC?: string[]) {
    if (!ttAnhXoa_TC || ttAnhXoa_TC.length === 0) return;

    // 1️⃣ Xóa ảnh trên Cloudinary
    await this.cloudinaryService.deleteImages(ttAnhXoa_TC);

    // 2️⃣ Cập nhật MongoDB, xóa ảnh trong tùy chọn sản phẩm
    await this.productModel.updateMany(
      {
        'phanLoai_SP.tuyChon_PL.anh_TC._id': {
          $in: ttAnhXoa_TC.map((id) => new Types.ObjectId(id)),
        },
      },
      {
        $pull: {
          'phanLoai_SP.$[].tuyChon_PL': {
            'anh_TC._id': {
              $in: ttAnhXoa_TC.map((id) => new Types.ObjectId(id)),
            },
          },
        },
      }
    );
  }

  // Xóa sản phẩm
  async deleteProduct(id: string): Promise<void> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }

    if (product.daAn_SP === false && product.daXoa_SP === false) {
      if (product.daXoa_SP === false) {
        let maxCode = await this.getMaxProductCode();
        await this.cloudinaryService.deleteFolder(`Product/${id}`);
        await this.deletedCodeService.saveDeletedCode(product.ma_SP, maxCode);
        await product.deleteOne();
        maxCode = await this.getMaxProductCode();
        await this.deletedCodeService.cleanupDeletedCodes(maxCode);
      } else {
        product.daXoa_SP = true;
        await product.save();
      }
    }
  }

  // Lấy nhiều sản phẩm
  async getProducts(page: number = 0, limit) {
    // Tính toán số sản phẩm cần bỏ qua
    const skip = page * limit;

    // Truy vấn sản phẩm từ database
    const products = await this.productModel
      .find({ daXoa_SP: false }) // Lọc sản phẩm chưa bị xóa
      .skip(skip)
      .limit(limit)
      .exec();

    // Nếu là trang đầu tiên, trả về tổng số sản phẩm và sản phẩm
    if (page === 0) {
      // Tổng số sản phẩm (để hỗ trợ phân trang trên frontend)
      const totalProducts = await this.productModel.countDocuments({
        daXoa_SP: false,
      });

      return {
        totalProducts,
        products,
      };
    }
    return {
      products,
    };
  }

  // Lấy sản phẩm theo ID
  async getProductById(id: string): Promise<SAN_PHAM> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
    }
    return product;
  }

  // Lấy sản phẩm theo mã sản phẩm
  async getProductByCode(code: number, limit: number): Promise<SAN_PHAM[]> {
    return await this.productModel
      .find(
        code ? { ma_SP: code, daXoa_SP: false } : { daXoa_SP: false } // Lọc theo mã sản phẩm nếu có
      )
      .limit(limit)
      .exec();
  }

  // Lấy sản phẩm theo từ khóa tìm kiếm
  async getProductBySearchKey(
    searchKey: string,
    limit: number
  ): Promise<SAN_PHAM[]> {
    return await this.productModel
      .find(
        { $text: { $search: searchKey }, daXoa_SP: false }, // Tìm kiếm gần đúng
        { score: { $meta: 'textScore' } } // Lấy điểm số phù hợp của kết quả
      )
      .sort({ score: { $meta: 'textScore' } }) // Sắp xếp theo độ phù hợp
      .limit(limit)
      .exec();
  }

  // Lấy sản phẩm theo danh mục
  async getProductsByCategory(
    page: number = 0,
    categoryId: string,
    limit: number
  ) {
    const skip = page * limit;
    const products = await this.productModel
      .find({ danhMuc_SP: categoryId, daXoa_SP: false })
      .skip(skip)
      .limit(limit)
      .exec();

    if (page === 0) {
      const totalProducts = await this.productModel.countDocuments({
        danhMuc_SP: categoryId,
        daXoa_SP: false,
      });

      return {
        totalProducts,
        products,
      };
    }
    return {
      products,
    };
  }

  async getMaxProductCode(): Promise<number> {
    const lastProduct = await this.productModel.findOne().sort({ ma_SP: -1 });
    return lastProduct ? (lastProduct as SAN_PHAM).ma_SP : 0;
  }
}
