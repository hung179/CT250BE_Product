import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDetailDocument = CHI_TIET_SP & Document;

@Schema()
export class CHI_TIET_SP {
  @Prop({ required: true })
  thuocTinh_CTSP!: string;

  @Prop({ required: true })
  giaTri_CTSP!: unknown;
}

export const CHI_TIET_SPSchema = SchemaFactory.createForClass(CHI_TIET_SP);
