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
  @Prop({ type: Number, required: true, unique: true, min: 1, max: 9999999 })
  ma_SP!: number;

  @Prop({ type: String, required: true, index: 'text', maxlength: 120 })
  ten_SP!: string;

  @Prop({
    type: {
      cap1_NH: { type: String, required: true },
      cap2_NH: { type: String, required: false, default: '' },
      cap3_NH: { type: String, required: false, default: '' },
    },
    required: true,
  })
  nganhHang_SP!: {
    cap1_NH: string;
    cap2_NH?: string;
    cap3_NH?: string;
  };

  @Prop({ type: String, required: true, minlength: 100, maxlength: 3000 })
  moTa_SP!: string;

  @Prop({ type: [{ public_id: String, url: String }] })
  anh_SP?: { public_id: string; url: string }[];

  @Prop({ type: { public_id: String, url: String } })
  anhBia_SP?: { public_id: string; url: string };

  @Prop({ default: false })
  daXoa_SP?: boolean;

  @Prop({ default: false })
  daAn_SP?: boolean;

  @Prop({
    type: [
      {
        thuocTinh_CTSP: { type: String },
        giaTri_CTSP: { type: String },
      },
    ],
  })
  ttChiTiet_SP!: {
    thuocTinh_CTSP: string;
    giaTri_CTSP: string;
  }[];

  @Prop({
    type: [
      {
        tuyChonPhanLoai1_BH: { type: Number },
        tuyChonPhanLoai2_BH: { type: Number },
        trongLuong_BH: { type: Number, min: 1, max: 999999 },
        giaBan_BH: { type: Number, required: true, min: 1000, max: 120000000 },
        khoHang_BH: { type: Number, required: true, min: 1, max: 999999 },
        doanhSo_BH: { type: Number, default: 0 },
      },
    ],
  })
  ttBanHang_SP!: {
    tuyChonPhanLoai1_BH: number;
    tuyChonPhanLoai2_BH: number;
    trongLuong_BH: number;
    giaBan_BH: number;
    khoHang_BH: number;
    doanhSo_BH: number;
  }[];

  @Prop({
    type: [
      {
        ten_PL: String,
        tuyChon_PL: [
          {
            ten_TC: { type: String },
          },
        ],
      },
    ],
  })
  phanLoai_SP?: {
    ten_PL: string;
    cap_PL: number;
    tuyChon_PL: {
      ten_TC: string;
    }[];
  }[];
}

export const SAN_PHAMSchema = SchemaFactory.createForClass(SAN_PHAM);
