import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'ngayTao_DG',
    updatedAt: 'ngayCapNhat_DG',
  },
})
export class Danh_Gia extends Document {
  @Prop({ required: true })
  idSanPham_DG!: string;

  @Prop({ required: true })
  idKhachHang_DG!: string;

  @Prop({ required: true })
  noiDung_DG?: string;

  @Prop({ required: true, min: 1, max: 5 })
  diem_DG!: number;
}

export const Danh_GiaSchema = SchemaFactory.createForClass(Danh_Gia);
