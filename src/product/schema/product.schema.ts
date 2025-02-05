import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
  anh_SP!: { public_id: string; url: string }[];

  @Prop({ default: false })
  daXoa_SP?: boolean;

  @Prop({ default: false })
  daAn_SP?: boolean;

  @Prop({ required: true })
  trongLuongSP!: number;

  @Prop({
    type: [
      {
        thuocTinh_CTSP: { type: String, required: true },
        giaTri_CTSP: { required: true },
      },
    ],
  })
  ttChiTiet_SP!: {
    thuocTinh_CTSP: string;
    giaTri_CTSP: unknown;
  }[];

  @Prop({
    type: [
      {
        tenPhanLoai_PL: String, // Tên phân loại
        tuyChon_PL: [
          {
            tenTuyChon_TC: { type: String, required: true },
            giaBan_TC: { type: Number, required: true },
            khoHang_TC: { type: Number, required: true },
            anh_TC: [{ public_id: String, url: String }], // Hình ảnh tùy chọn
          },
        ],
      },
    ],
  })
  phanLoai_SP?: {
    tenPhanLoai_PL: string;
    tuyChon_PL: {
      tenTuyChon_TC: string;
      giaBan_TC: number;
      khoHang_TC: number;
      anh_TC: { public_id: string; url: string }[];
    }[];
  }[]; // Phân loại sản phẩm với tùy chọn
}

export const SAN_PHAMSchema = SchemaFactory.createForClass(SAN_PHAM);
