import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductSellingCategoryDocument = PHAN_LOAI_SP & Document;

@Schema()
export class PHAN_LOAI_SP {
  @Prop({ required: true })
  tenPhanLoai_PL!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'TUY_CHON_PL' }] })
  tuyChon_PL!: Types.ObjectId[];
}

export const PHAN_LOAI_SPSchema = SchemaFactory.createForClass(PHAN_LOAI_SP);
