import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type CartDocument = GIO_HANG & Document;
@Schema()
export class GIO_HANG extends Document {
  @Prop({ required: true, unique: true })
  idKhachHang_GH!: string;

  @Prop({
    type: [
      {
        idSanPham_GH: String,
        idTTBanHang_GH: String,
        soLuong_GH: Number,
      },
    ],
    default: [],
  })
  chiTiet_GH?: {
    idSanPham_GH: string;
    idTTBanHang_GH: string;
    soLuong_GH: number;
  }[];
}

export const GIO_HANGSchema = SchemaFactory.createForClass(GIO_HANG);
