import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'ngayTao_DG',
    updatedAt: 'ngayCapNhat_DG',
  },
})
export class DANH_GIA extends Document {
  @Prop({ required: true })
  idSanPham_DG!: string;

  @Prop({ required: true })
  idKhachHang_DG!: string;

  @Prop({ required: true })
  idHoaDon_DG!: string;

  @Prop({ required: true })
  noiDung_DG?: string;

  @Prop({ required: true, min: 1, max: 5 })
  diem_DG!: number;
}

export const DANH_GIASchema = SchemaFactory.createForClass(DANH_GIA);
