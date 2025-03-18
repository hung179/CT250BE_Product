/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SAN_PHAM, ProductDocument } from './product.schema';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DeletedProductCodeService } from '../deletedProductCode/deletedProductCode.service';
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
    fileAnh_SP: any,
    fileAnhBia_SP: any
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
          fileAnhBia_SP
        );
      if (!productImageCover)
        throw new InternalServerErrorException(
          'Không thể tải ảnh bìa sản phẩm'
        );
      const productImages = await this.cloudinaryService.uploadProductImages(
        productId,
        fileAnh_SP
      );
      if (!productImages)
        throw new InternalServerErrorException('Không thể tải ảnh sản phẩm');
      product.anh_SP = productImages.anh_SP_uploaded;
      product.anhBia_SP = productImageCover.anh_SP_uploaded;
      const savedProduct = await product.save();
      return { success: true, data: savedProduct };
    } catch (error) {
      console.log(error);
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
      fileAnh_SP: any;
      fileAnhBia_SP: any;
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
      await this.capNhatAnhBia(id, updatedProduct, files.fileAnhBia_SP);
      await this.themAnhSanPham(id, updatedProduct, files.fileAnh_SP);
      await this.xoaAnhSanPham(id, updateData.ttAnhXoa_SP);

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
    product.anhBia_SP = productImageCover;
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

  private async xoaAnhSanPham(productId: string, ttAnhXoa_SP?: string[]) {
    if (!ttAnhXoa_SP || ttAnhXoa_SP.length === 0) return;
    await this.cloudinaryService.deleteImages(ttAnhXoa_SP);
    await this.productModel.updateOne(
      { _id: productId }, // Chỉ cập nhật sản phẩm cụ thể
      {
        $pull: {
          anh_SP: {
            public_id: { $in: ttAnhXoa_SP },
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

      if (product.daAn_SP === true) {
        let maxCode = await this.getMaxProductCode();
        await this.cloudinaryService.deleteFolder(`Products/${id}`);
        await this.deletedCodeService.saveDeletedCode(product.ma_SP, maxCode);
        await this.reviewService.deleteAllReviewProduct(id);
        await product.deleteOne();
        maxCode = await this.getMaxProductCode();
        await this.deletedCodeService.cleanupDeletedCodes(maxCode);
      } else {
        product.daXoa_SP = true;
        await product.save();
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async updateStateProduct(
    id: string,
    state: boolean
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await this.productModel
        .findByIdAndUpdate({ _id: id }, { daAn_SP: state }, { new: true })
        .select('_id anhBia_SP ttBanHang_SP phanLoai_SP ten_SP ma_SP daAn_SP');

      if (!result) {
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  /////////////// Lấy nhiều sản phẩm
  async getProducts(
    page: number,
    limit: number,
    state?: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const skip = page * limit;
      let filter: any = {};

      if (state === 1) {
        filter = { daAn_SP: false };
      } else if (state === 2) {
        filter = { daAn_SP: true };
      }

      const [products, totalProducts] = await Promise.all([
        this.productModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .select('_id anhBia_SP ttBanHang_SP phanLoai_SP ten_SP ma_SP daAn_SP')
          .exec(),
        this.productModel.countDocuments(filter),
      ]);

      if (products.length === 0) {
        throw new NotFoundException('Không tìm thấy sản phẩm');
      }

      return { success: true, data: { totalProducts, products } };
    } catch (error) {
      return { success: false, error };
    }
  }

  ////////////////////// Lấy sản phẩm theo ID
  async getProductById(
    id: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const product = await this.productModel.findById(id);
      if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
      //const reviews = await this.reviewService.getReviewsByProduct(id);
      //return { success: true, data: { product, reviews } };
      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Lấy sản phẩm theo mã sản phẩm
  async getProductByCode(
    code: number,
    page: number,
    limit: number,
    state?: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const skip = page * limit;
      const filter: any = { ma_SP: code };

      if (state === 1) {
        filter.daAn_SP = false;
      } else if (state === 2) {
        filter.daAn_SP = true;
      }

      const [products, totalProducts] = await Promise.all([
        this.productModel.find(filter).limit(limit).skip(skip).exec(),
        this.productModel.countDocuments(filter),
      ]);

      if (products.length === 0)
        throw new NotFoundException('Không tìm thấy sản phẩm');

      return { success: true, data: { totalProducts, products } };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Lấy sản phẩm theo từ khóa tìm kiếm
  async getProductBySearchKey(
    searchKey: string,
    page: number,
    limit: number,
    state?: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const skip = page * limit;
      const filter: any = { $text: { $search: searchKey } };

      if (state === 1) {
        filter.daAn_SP = false;
      } else if (state === 2) {
        filter.daAn_SP = true;
      }

      const [products, totalProducts] = await Promise.all([
        this.productModel
          .find(filter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .skip(skip)
          .exec(),
        this.productModel.countDocuments(filter),
      ]);

      if (products.length === 0)
        throw new NotFoundException('Không tìm thấy sản phẩm');

      return { success: true, data: { totalProducts, products } };
    } catch (error) {
      return { success: false, error };
    }
  }

  // Lấy sản phẩm theo danh mục
  async getProductsByCategory(
    page: number,
    categoryId: string,
    limit: number,
    state?: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const skip = page * limit;
      const filter: any = {
        $or: [
          { 'nganhHang_SP.cap1_NH': categoryId },
          { 'nganhHang_SP.cap2_NH': categoryId },
          { 'nganhHang_SP.cap3_NH': categoryId },
        ],
      };

      if (state === 1) {
        filter.daAn_SP = false;
      } else if (state === 2) {
        filter.daAn_SP = true;
      }

      const [products, totalProducts] = await Promise.all([
        this.productModel.find(filter).skip(skip).limit(limit).exec(),
        this.productModel.countDocuments(filter),
      ]);

      if (products.length === 0)
        throw new NotFoundException('Không tìm thấy sản phẩm');

      return { success: true, data: { totalProducts, products } };
    } catch (error) {
      return { success: false, error };
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

      return {
        success: true,
        data: {
          _id: product._id,
          ten_SP: product.ten_SP,
          anh_SP: product.anhBia_SP,
          ttBanHang_SP: ttBanHang,
          phanLoai_SP: product.phanLoai_SP,
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

      if (!products || products.length === 0) {
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

          return {
            _id: product._id,
            ten_SP: product.ten_SP,
            anh_SP: product.anhBia_SP,
            ttBanHang_SP: ttBanHang,
            phanLoai_SP: product.phanLoai_SP,
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
      idSanPham_CTDH: string;
      idTTBanHang_CTDH: string;
      tenSanPham_CTDH: string;
      ttBanHang_CTDH: string;
      soLuong_CTDH: number;
      giaMua_CTDH: number;
    }[],
    hoanKho: boolean = false
  ): Promise<{
    success: boolean;
    data?: {
      idSanPham_CTDH: string;
      idTTBanHang_CTDH: string;
      tenSanPham_CTDH: string;
      ttBanHang_CTDH: string;
      soLuong_CTDH: number;
      giaMua_CTDH: number;
    }[];
    error?: any;
  }> {
    const session = await this.productModel.startSession();
    session.startTransaction();

    try {
      // 🔍 Lấy danh sách ID sản phẩm để truy vấn 1 lần
      const danhSachIdSanPham = [
        ...new Set(ttSanPham.map((sp) => sp.idSanPham_CTDH)),
      ];
      const sanPhams = await this.productModel
        .find({ _id: { $in: danhSachIdSanPham } })
        .session(session);
      if (sanPhams.length !== danhSachIdSanPham.length) {
        await session.abortTransaction();
        return { success: false, error: `Có sản phẩm không tồn tại.` };
      }

      const danhSachCapNhat: any[] = [];
      const ketQuaTraVe: {
        idSanPham_CTDH: string;
        idTTBanHang_CTDH: string;
        maSanPham_CTDH: number;
        tenSanPham_CTDH: string;
        ttBanHang_CTDH: string;
        soLuong_CTDH: number;
        giaMua_CTDH: number;
      }[] = [];

      for (const sp of ttSanPham) {
        const sanPham = sanPhams.find(
          (s) => (s._id as any).toString() === sp.idSanPham_CTDH
        );
        if (!sanPham) {
          await session.abortTransaction();
          return {
            success: false,
            error: `Sản phẩm ${sp.idSanPham_CTDH} không tồn tại.`,
          };
        }

        const banHang = sanPham.ttBanHang_SP?.find(
          (item: any) => item._id?.toString() === sp.idTTBanHang_CTDH
        );

        if (!banHang) {
          await session.abortTransaction();
          return {
            success: false,
            error: `Không tìm thấy thông tin bán hàng ${sp.idTTBanHang_CTDH} trong sản phẩm ${sp.idSanPham_CTDH}.`,
          };
        }

        if (!hoanKho && banHang.khoHang_BH < sp.soLuong_CTDH) {
          await session.abortTransaction();
          return {
            success: false,
            error: `Sản phẩm ${sp.idSanPham_CTDH} - Kho hàng ${sp.idTTBanHang_CTDH} không đủ hàng.`,
          };
        }

        const soLuongMoi = hoanKho
          ? banHang.khoHang_BH + sp.soLuong_CTDH
          : banHang.khoHang_BH - sp.soLuong_CTDH;

        const doanhSoMoi = hoanKho
          ? banHang.doanhSo_BH - 1
          : banHang.doanhSo_BH + 1;

        danhSachCapNhat.push({
          updateOne: {
            filter: {
              _id: sp.idSanPham_CTDH,
              'ttBanHang_SP._id': sp.idTTBanHang_CTDH,
            },
            update: {
              $set: {
                'ttBanHang_SP.$.khoHang_BH': soLuongMoi,
                'ttBanHang_SP.$.doanhSo_BH': doanhSoMoi,
              },
            },
          },
        });

        const tenTuyChon1 =
          sanPham.phanLoai_SP?.[0]?.tuyChon_PL?.[banHang.tuyChonPhanLoai1_BH]
            ?.ten_TC || null;
        const tenTuyChon2 =
          sanPham.phanLoai_SP?.[1]?.tuyChon_PL?.[banHang.tuyChonPhanLoai2_BH]
            ?.ten_TC || null;

        let ttBanHang = '';

        if (tenTuyChon1 && tenTuyChon2) {
          ttBanHang = `${tenTuyChon1} - ${tenTuyChon2}`;
        } else if (tenTuyChon1) {
          ttBanHang = tenTuyChon1;
        } else if (tenTuyChon2) {
          ttBanHang = tenTuyChon2;
        }

        ketQuaTraVe.push({
          idSanPham_CTDH: sp.idSanPham_CTDH,
          idTTBanHang_CTDH: sp.idTTBanHang_CTDH,
          maSanPham_CTDH: sanPham.ma_SP,
          tenSanPham_CTDH: sanPham.ten_SP,
          ttBanHang_CTDH: ttBanHang,
          soLuong_CTDH: sp.soLuong_CTDH,
          giaMua_CTDH: banHang.giaBan_BH,
        });
      }

      if (danhSachCapNhat.length) {
        await this.productModel.bulkWrite(danhSachCapNhat, {
          session,
        });
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

      return { success: false, error: error };
    }
  }
}
