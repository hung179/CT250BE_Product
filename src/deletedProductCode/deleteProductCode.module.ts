import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeletedProductCodeService } from './deletedProductCode.service';
import {
  DeletedProductCode,
  DeletedProductCodeSchema,
} from './deletedProductCode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeletedProductCode.name, schema: DeletedProductCodeSchema },
    ]),
  ],
  providers: [DeletedProductCodeService],
  exports: [DeletedProductCodeService],
})
export class DeletedProductCodeModule {}
