import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from './cart.service';

@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Lấy giỏ hàng của khách hàng
  @MessagePattern('cart_get')
  async getCart(@Payload() data: { idKhachHang: string }) {
    return this.cartService.getCart(data.idKhachHang);
  }

  // Thêm sản phẩm vào giỏ hàng
  @MessagePattern('cart_add')
  async addToCart(
    @Payload()
    data: {
      idKhachHang: string;
      idSanPham: string;
      idTTBanHang: string;
      soLuong: number;
    }
  ) {
    return this.cartService.addToCart(
      data.idKhachHang,
      data.idSanPham,
      data.idTTBanHang,
      data.soLuong
    );
  }

  // Xóa sản phẩm khỏi giỏ hàng
  @MessagePattern('cart_remove')
  async removeFromCart(
    @Payload()
    data: {
      idKhachHang: string;
      products: { idSanPham_GH: string; idTTBanHang_GH: string }[];
    }
  ) {
    return this.cartService.removeFromCart(data.idKhachHang, data.products);
  } 
}
