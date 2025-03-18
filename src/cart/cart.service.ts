import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GIO_HANG, CartDocument } from './cart.schema';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(GIO_HANG.name) private cartModel: Model<CartDocument>,
    private readonly productService: ProductService
  ) {}

  // Lấy giỏ hàng của khách hàng
  async getCart(
    idKhachHang: string
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const cart = await this.cartModel.findOne({
        idKhachHang_GH: idKhachHang,
      });

      if (!cart) {
        throw new NotFoundException(
          `Không tìm thấy giỏ hàng của khách hàng với ID = ${idKhachHang}`
        );
      }

      // Gọi ProductService để lấy thông tin sản phẩm
      const updatedChiTiet = await Promise.all(
        (cart.chiTiet_GH ?? []).map(async (item) => {
          const productData = await this.productService.getProductSalesInf(
            item.idTTBanHang_GH
          );
          return {
            idSanPham_GH: item.idSanPham_GH,
            idTTBanHang_GH: item.idTTBanHang_GH,
            soLuong_GH: item.soLuong_GH,
            thongTinSanPham: productData.success ? productData.data : null,
          };
        })
      );
      return {
        success: true,
        data: {
          idKhachHang_GH: cart.idKhachHang_GH,
          chiTiet_GH: updatedChiTiet,
        },
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(
    idKhachHang: string,
    idSanPham: string,
    idTTBanHang: string,
    soLuong: number
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      let cart = await this.cartModel.findOne({ idKhachHang_GH: idKhachHang });

      if (!cart) {
        cart = new this.cartModel({
          idKhachHang_GH: idKhachHang,
          chiTiet_GH: [],
        });
      }

      // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
      const existingItemIndex =
        cart.chiTiet_GH?.findIndex(
          (item) =>
            item.idSanPham_GH === idSanPham &&
            item.idTTBanHang_GH === idTTBanHang
        ) ?? -1;

      if (existingItemIndex !== -1) {
        // Nếu đã có, cập nhật số lượng và đưa lên đầu danh sách
        if (cart.chiTiet_GH) {
          const updatedItem = cart.chiTiet_GH.splice(existingItemIndex, 1)[0];
          updatedItem.soLuong_GH += soLuong;
          cart.chiTiet_GH.unshift(updatedItem); // Đưa lên đầu danh sách
        }
      } else {
        // Nếu chưa có, thêm mới vào đầu danh sách
        cart.chiTiet_GH = cart.chiTiet_GH || [];
        cart.chiTiet_GH.unshift({
          idSanPham_GH: idSanPham,
          idTTBanHang_GH: idTTBanHang,
          soLuong_GH: soLuong,
        });
      }

      const updatedCart = await cart.save();
      return { success: true, data: updatedCart };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Xóa một hoặc nhiều sản phẩm khỏi giỏ hàng
  async removeFromCart(
    idKhachHang: string,
    products: { idSanPham_GH: string; idTTBanHang_GH: string }[]
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const cart = await this.cartModel.findOne({
        idKhachHang_GH: idKhachHang,
      });

      if (!cart) {
        throw new NotFoundException(
          `Không tìm thấy giỏ hàng của khách hàng với ID = ${idKhachHang}`
        );
      }

      // Lọc bỏ tất cả sản phẩm cần xóa
      if (cart.chiTiet_GH) {
        cart.chiTiet_GH = cart.chiTiet_GH.filter(
          (item) =>
            !products.some(
              (p) =>
                p.idSanPham_GH === item.idSanPham_GH &&
                p.idTTBanHang_GH === item.idTTBanHang_GH
            )
        );
      }

      const updatedCart = await cart.save();
      return { success: true, data: updatedCart };
    } catch (error) {
      return { success: false, error };
    }
  }
}
