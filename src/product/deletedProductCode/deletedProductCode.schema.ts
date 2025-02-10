import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DeletedProductCode extends Document {
  @Prop({ required: true, unique: true })
  code!: number;
}

export const DeletedProductCodeSchema =
  SchemaFactory.createForClass(DeletedProductCode);
