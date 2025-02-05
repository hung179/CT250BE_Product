import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = SAN_PHAM & Document;

@Schema({
  timestamps: {
    createdAt: 'ngayTao_SP',
    updatedAt: 'ngayCapNhat_SP',
  },
})
export class SAN_PHAM {
  @Prop({ required: true, unique: true })
  ma_SP!: string;

  @Prop({ required: true })
  ten_SP!: string;

  @Prop({ type: String, required: true })
  nganhHang_SP!: string;

  @Prop({ required: true })
  moTa_SP!: string;

  @Prop({ type: [{ public_id: String, url: String }] })
  anh_SP?: { public_id: string; url: string }[];

  @Prop({ default: false })
  daXoa_SP?: boolean;

  @Prop({ default: false })
  daAn_SP?: boolean;

  @Prop({ required: true })
  trongLuongSP!: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'CHI_TIET_SP' })
  ttChiTiet_SP!: string[];

  @Prop({ required: true, type: Types.ObjectId, ref: 'PHAN_LOAI_SP' })
  phanLoai_SP?: string[];
}

export const SAN_PHAMSchema = SchemaFactory.createForClass(SAN_PHAM);
