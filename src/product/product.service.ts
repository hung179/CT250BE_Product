import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SAN_PHAM, ProductDocument } from './schema/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DeletedProductCodeService } from './deletedProductCode/deletedProductCode.service';
import { ReviewService } from '../review/review.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(SAN_PHAM.name) private productModel: Model<ProductDocument>,
    private cloudinaryService: CloudinaryService,
    private readonly deletedCodeService: DeletedProductCodeService,
    private readonly reviewService: ReviewService,
    private readonly redisService: RedisService
  ) {}

  // Tạo mới sản phẩm
  async createProduct(
    dto: CreateProductDto,
    anh_SP: Express.Multer.File[],
    anh_TC: Express.Multer.File[],
    anhBia_SP: Express.Multer.File
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const maxCode = await this.getMaxProductCode();
      const nextCode =
        await this.deletedCodeService.getNextProductCode(maxCode);
      const product = new this.productModel({ ...dto, ma_SP: nextCode });
      const productId = product._id as string;
      const productImageCover =
        await this.cloudinaryService.uploadProductImageCover(
          productId,
          anhBia_SP
        );
      if (!productImageCover)
        throw new InternalServerErrorException(
          'Không thể tải ảnh bìa sản phẩm'
        );
      const productImages = await this.cloudinaryService.uploadProductImages(
        productId,
        anh_SP
      );

      if (!productImages)
        throw new InternalServerErrorException('Không thể tải ảnh sản phẩm');

      const idTuyChonCoAnh: string[] =
        product.phanLoai_SP
          ?.filter((pl) => pl.cap_PL === 1)
          .flatMap((pl) =>
            pl.tuyChon_PL
              .filter((tc) => tc.coAnh_TC === true)
              .map((tc: any) => tc._id?.toString() as string)
          )
          ?.filter((id): id is string => !!id) || [];

      const productOptionImages =
        await this.cloudinaryService.uploadProductOptionImages(
          productId,
          anh_TC,
          idTuyChonCoAnh
        );

      product.anh_SP = productImages.anh_SP_uploaded;
      product.anhBia_SP = productImageCover.anh_SP_uploaded;
      if (
        product.phanLoai_SP &&
        product.phanLoai_SP.some((pl) => pl.cap_PL === 1) &&
        productOptionImages.anh_TC_uploaded.length > 0
      ) {
        let index = 0;

        product.phanLoai_SP
          .filter((phanLoai) => phanLoai.cap_PL === 1)
          .forEach((phanLoai) => {
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
      const savedProduct = await product.save();
      return { success: true, data: savedProduct };
    } catch (error) {
      return {
        success: false,
        error: error,
      };
    }
  }

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
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
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
      if (!updatedProduct) {
        throw new InternalServerErrorException(
          'Không tìm thấy sản phẩm sau khi cập nhật'
        );
      }
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

      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
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
        ?.filter((pl) => pl.cap_PL === 1)
        .flatMap((pl) =>
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

    await this.cloudinaryService.deleteImages(ttAnhXoa_TC);

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

  /////////////////////// Xóa sản phẩm
  async deleteProduct(
    id: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      }

      if (product.daAn_SP === false && product.daXoa_SP === false) {
        if (product.daXoa_SP === false) {
          let maxCode = await this.getMaxProductCode();
          await this.cloudinaryService.deleteFolder(`Product/${id}`);
          await this.deletedCodeService.saveDeletedCode(product.ma_SP, maxCode);
          await this.reviewService.deleteAllReviewProduct(id);
          await product.deleteOne();
          maxCode = await this.getMaxProductCode();
          await this.deletedCodeService.cleanupDeletedCodes(maxCode);
        } else {
          product.daXoa_SP = true;
          await product.save();
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  /////////////// Lấy nhiều sản phẩm
  async getProducts(
    page: number,
    limit: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    const skip = page * limit;
    try {
      const products = await this.productModel
        .find({ daXoa_SP: false })
        .skip(skip)
        .limit(limit)
        .exec();
      if (!products) throw new NotFoundException('Không tìm thấy sản phẩm');
      if (page === 0) {
        const totalProducts = await this.productModel.countDocuments({
          daXoa_SP: false,
        });
        return {
          success: true,
          data: {
            totalProducts,
            products,
          },
        };
      }
      return { success: true, data: { products } };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  ////////////////////// Lấy sản phẩm theo ID
  async getProductById(
    id: string,
    page: number,
    limit: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const product = await this.productModel.findById(id);
      if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
      const reviews = await this.reviewService.getReviewsByProduct(
        id,
        (page = 0),
        limit
      );
      return { success: true, data: { product, reviews } };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Lấy sản phẩm theo mã sản phẩm
  async getProductByCode(
    code: number,
    limit: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await this.productModel
        .find(code ? { ma_SP: code, daXoa_SP: false } : { daXoa_SP: false })
        .limit(limit)
        .exec();
      if (result) throw new NotFoundException('Không tim thấy sản phẩm');
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Lấy sản phẩm theo từ khóa tìm kiếm
  async getProductBySearchKey(
    searchKey: string,
    page: number,
    limit: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const skip = page * limit;
      const result = await this.productModel
        .find(
          { $text: { $search: searchKey }, daXoa_SP: false },
          { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .skip(skip)
        .exec();
      if (result) {
        throw new NotFoundException('Không tim thấy sản phẩm');
      }
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Lấy sản phẩm theo danh mục
  async getProductsByCategory(
    page: number = 0,
    categoryId: string,
    limit: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const skip = page * limit;
      const products = await this.productModel
        .find({ danhMuc_SP: categoryId, daXoa_SP: false })
        .skip(skip)
        .limit(limit)
        .exec();
      if (products) throw new NotFoundException('Không tim thấy sản phẩm');
      const totalProducts = await this.productModel.countDocuments({
        danhMuc_SP: categoryId,
        daXoa_SP: false,
      });
      return { success: true, data: { totalProducts, products } };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  private async getMaxProductCode(): Promise<number> {
    const lastProduct = await this.productModel.findOne().sort({ ma_SP: -1 });
    return lastProduct ? (lastProduct as SAN_PHAM).ma_SP : 0;
  }

  async getProductSalesInf(
    idTTBanHang: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const product = await this.productModel.findOne({
        'ttBanHang_SP._id': idTTBanHang,
      });

      if (!product)
        throw new NotFoundException(
          `Không tìm thấy sản phẩm với ttBanHang_SP._id = ${idTTBanHang}`
        );

      // Lấy thông tin bán hàng có _id khớp
      const ttBanHang = product.ttBanHang_SP?.find(
        (item: any) => item._id && item._id.toString() === idTTBanHang
      );
      if (!ttBanHang)
        throw new NotFoundException(
          `Không tìm thấy thông tin bán hàng với _id = ${idTTBanHang}`
        );

      // Tìm tùy chọn phân loại 1 tương ứng
      const phanLoai1 = product.phanLoai_SP?.find((pl) =>
        pl.tuyChon_PL.some((tc) => tc.ten_TC === ttBanHang.tuyChonPhanLoai1_BH)
      );

      // Lấy thông tin tùy chọn phân loại 1 (nếu có)
      let anh = phanLoai1
        ? phanLoai1.tuyChon_PL.find(
            (tc) => tc.ten_TC === ttBanHang.tuyChonPhanLoai1_BH
          )?.anh_TC
        : null;

      if (!anh) {
        anh = product.anhBia_SP;
      }
      return {
        success: true,
        data: {
          _id: product._id,
          ten_SP: product.ten_SP,
          anh_SP: anh,
          ttBanHang_SP: ttBanHang,
        },
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }
  async getMultipleProductSalesInf(
    idTTBanHangList: string[]
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const products = await this.productModel.find({
        'ttBanHang_SP._id': { $in: idTTBanHangList },
      });

      if (!products.length) {
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }

      const result = idTTBanHangList.map((idTTBanHang) => {
        try {
          const product = products.find((prod) =>
            prod.ttBanHang_SP?.some(
              (item: any) => item._id.toString() === idTTBanHang
            )
          );

          if (!product) {
            throw new NotFoundException('Không tìm thấy sản phẩm');
          }

          const ttBanHang = product.ttBanHang_SP?.find(
            (item: any) => item._id.toString() === idTTBanHang
          );

          if (!ttBanHang) {
            throw new NotFoundException(
              'Không tìm thấy thông tin bán hàng cho sản phẩm'
            );
          }

          const phanLoai1 = product.phanLoai_SP?.find((pl) =>
            pl.tuyChon_PL.some(
              (tc) => tc.ten_TC === ttBanHang.tuyChonPhanLoai1_BH
            )
          );

          const anh = phanLoai1
            ? phanLoai1.tuyChon_PL.find(
                (tc) => tc.ten_TC === ttBanHang.tuyChonPhanLoai1_BH
              )?.anh_TC
            : product.anhBia_SP;

          return {
            _id: product._id,
            ten_SP: product.ten_SP,
            anh_SP: anh,
            ttBanHang_SP: ttBanHang,
          };
        } catch (error) {
          return { idTTBanHang, error: error };
        }
      });

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async capNhatKhoHang(
    ttSanPham: {
      idSanPham_CTHD: string;
      idTTBanHang_CTHD: string;
      soLuong_CTHD: number;
      giaMua_CTHD: number;
    }[],
    hoanKho: boolean = false
  ): Promise<{
    success: boolean;
    data?: {
      idSanPham_CTHD: string;
      idTTBanHang_CTHD: string;
      soLuong_CTHD: number;
      giaMua_CTHD: number;
    }[];
    error?: string;
  }> {
    const session = await this.productModel.startSession();
    session.startTransaction();

    try {
      // 🔍 Lấy danh sách ID sản phẩm để truy vấn 1 lần
      const danhSachIdSanPham = ttSanPham.map((sp) => sp.idSanPham_CTHD);
      const sanPhams = await this.productModel
        .find({ _id: { $in: danhSachIdSanPham } })
        .session(session);

      if (sanPhams.length !== danhSachIdSanPham.length) {
        await session.abortTransaction();
        return { success: false, error: `Có sản phẩm không tồn tại.` };
      }

      const danhSachCapNhat: any[] = [];
      const ketQuaTraVe: {
        idSanPham_CTHD: string;
        idTTBanHang_CTHD: string;
        soLuong_CTHD: number;
        giaMua_CTHD: number;
      }[] = [];

      for (const sp of ttSanPham) {
        const sanPham = sanPhams.find(
          (s) => (s._id as any).toString() === sp.idSanPham_CTHD
        );
        if (!sanPham) {
          await session.abortTransaction();
          return {
            success: false,
            error: `Sản phẩm ${sp.idSanPham_CTHD} không tồn tại.`,
          };
        }

        const banHang = sanPham.ttBanHang_SP?.find(
          (item: any) => item._id?.toString() === sp.idTTBanHang_CTHD
        );

        if (!banHang) {
          await session.abortTransaction();
          return {
            success: false,
            error: `Không tìm thấy thông tin bán hàng ${sp.idTTBanHang_CTHD} trong sản phẩm ${sp.idSanPham_CTHD}.`,
          };
        }

        if (!hoanKho && banHang.khoHang_BH < sp.soLuong_CTHD) {
          await session.abortTransaction();
          return {
            success: false,
            error: `Sản phẩm ${sp.idSanPham_CTHD} - Kho hàng ${sp.idTTBanHang_CTHD} không đủ hàng.`,
          };
        }

        const soLuongMoi = hoanKho
          ? banHang.khoHang_BH + sp.soLuong_CTHD
          : banHang.khoHang_BH - sp.soLuong_CTHD;

        danhSachCapNhat.push({
          updateOne: {
            filter: {
              _id: sp.idSanPham_CTHD,
              'ttBanHang_SP._id': sp.idTTBanHang_CTHD,
            },
            update: { $set: { 'ttBanHang_SP.$.khoHang_BH': soLuongMoi } },
          },
        });

        ketQuaTraVe.push({
          idSanPham_CTHD: sp.idSanPham_CTHD,
          idTTBanHang_CTHD: sp.idTTBanHang_CTHD,
          soLuong_CTHD: sp.soLuong_CTHD,
          giaMua_CTHD: banHang.giaBan_BH,
        });
      }

      if (danhSachCapNhat.length) {
        await this.productModel.bulkWrite(danhSachCapNhat, { session });
      }

      await session.commitTransaction();
      session.endSession();
      if (hoanKho) {
        return { success: true };
      } else {
        return { success: true, data: ketQuaTraVe };
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: (error as Error).message.toString() };
    }
  }
}
