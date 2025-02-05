import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductSellingOptionDocument = TUY_CHON_PL & Document;

@Schema()
export class TUY_CHON_PL {
  @Prop({ required: true })
  tenTuyChon_TC!: string;

  @Prop({ required: true })
  giaBan_TC!: number;

  @Prop({ required: true })
  khoHang_TC!: number;

  @Prop({ required: true })
  anh_TC?: string;

  @Prop({ default: 0 })
  soLuongDaBan_TC!: number;
}

export const TUY_CHON_PLSchema = SchemaFactory.createForClass(TUY_CHON_PL);
