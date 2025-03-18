import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SAN_PHAM, SAN_PHAMSchema } from './product.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DeletedProductCodeModule } from '../deletedProductCode/deleteProductCode.module';
import { ReviewModule } from '../review/review.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SAN_PHAM.name, schema: SAN_PHAMSchema },
    ]),
    DeletedProductCodeModule,
    ReviewModule,
    RedisModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, CloudinaryService],
  exports: [ProductService],
})
export class ProductModule {}
