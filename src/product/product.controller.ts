import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('product_create')
  async createProduct(
    @Payload()
    payload: {
      createProductDto: CreateProductDto;
      files: {
        fileAnhBia_SP?: {
          originalname: string;
          mimetype: string;
          buffer: string;
        };
        fileAnh_SP?: {
          originalname: string;
          mimetype: string;
          buffer: string;
        }[];
      };
    }
  ) {
    const convertFile = (file?: {
      originalname: string;
      mimetype: string;
      buffer: string;
    }) =>
      file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: Buffer.from(file.buffer, 'base64'),
          }
        : null;
    const fileAnhBia_SP = convertFile(payload.files.fileAnhBia_SP);
    const fileAnh_SP =
      payload.files.fileAnh_SP?.map((f) => convertFile(f)) || [];
    return this.productService.createProduct(
      payload.createProductDto,
      fileAnh_SP,
      fileAnhBia_SP
    );
  }

  @MessagePattern('product_update')
  async updateProduct(
    @Payload()
    payload: {
      id: string;
      updateProductDto: UpdateProductDto;
      files: {
        fileAnhBia_SP?: {
          originalname: string;
          mimetype: string;
          buffer: string;
        };
        fileAnh_SP?: {
          originalname: string;
          mimetype: string;
          buffer: string;
        }[];
      };
    }
  ) {
    const convertFile = (file?: {
      originalname: string;
      mimetype: string;
      buffer: string;
    }) =>
      file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: Buffer.from(file.buffer, 'base64'),
          }
        : null;
    const fileAnhBia_SP = convertFile(payload.files.fileAnhBia_SP);
    const fileAnh_SP =
      payload.files.fileAnh_SP?.map((f) => convertFile(f)) || [];
    return this.productService.updateProduct(
      payload.id,
      payload.updateProductDto,
      {
        fileAnhBia_SP,
        fileAnh_SP,
      }
    );
  }

  @MessagePattern('product_delete')
  async deleteProduct(@Payload() id: string) {
    return this.productService.deleteProduct(id);
  }

  @MessagePattern('product_update-state')
  async updateStateProduct(@Payload() payload: { state: boolean; id: string }) {
    return this.productService.updateStateProduct(payload.id, payload.state);
  }

  @MessagePattern('product_get-sale-info')
  async getSalesInf(@Payload() idSalesInf: string) {
    return this.productService.getProductSalesInf(idSalesInf);
  }

  @MessagePattern('product_get-multiple-sale-info')
  async getMultipleSalesInf(@Payload() idSalesInf: string[]) {
    return this.productService.getMultipleProductSalesInf(idSalesInf);
  }

  @MessagePattern('product_get-all')
  async getProducts(
    @Payload() payload: { page: number; limit: number; state: number }
  ) {
    return this.productService.getProducts(
      payload.page,
      payload.limit,
      payload.state
    );
  }

  @MessagePattern('product_search')
  async getProduct(
    @Payload()
    payload: {
      searchKey?: string;
      category?: string;
      code?: number;
      limit: number;
      page: number;
      state: number;
    }
  ) {
    const { searchKey, code, category, limit, page, state } = payload;
    if (searchKey && searchKey != '') {
      return this.productService.getProductBySearchKey(
        searchKey,
        state,
        page,
        limit
      );
    } else if (code) {
      return this.productService.getProductByCode(code, state, page, limit);
    } else if (category && category != '') {
      return this.productService.getProductsByCategory(
        page,
        category,
        limit,
        state
      );
    } else return { success: true, data: [] };
  }

  @MessagePattern('product_detail')
  async productDetail(
    @Payload()
    payload: {
      id: string;
    }
  ) {
    const { id } = payload;
    return this.productService.getProductById(id);
  }

  @MessagePattern('giam_kho_san_pham')
  async giamKhoHang(
    @Payload()
    ttSanPham: {
      idSanPham_CTDH: string;
      idTTBanHang_CTDH: string;
      tenSanPham_CTDH: string;
      ttBanHang_CTDH: string;
      soLuong_CTDH: number;
      giaMua_CTDH: number;
    }[]
  ) {
    return this.productService.capNhatKhoHang(ttSanPham);
  }

  @MessagePattern('hoan_kho_san_pham')
  hoanKhoHang(
    @Payload()
    ttSanPham: {
      idSanPham_CTDH: string;
      idTTBanHang_CTDH: string;
      tenSanPham_CTDH: string;
      ttBanHang_CTDH: string;
      soLuong_CTDH: number;
      giaMua_CTDH: number;
    }[]
  ) {
    return this.productService.capNhatKhoHang(ttSanPham, true);
  }
}
