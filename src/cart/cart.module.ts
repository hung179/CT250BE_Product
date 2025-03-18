import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from 'src/redis/redis.module';
import { GIO_HANG, GIO_HANGSchema } from './cart.schema';
import { CartService } from './cart.service';
import { ProductModule } from 'src/product/product.module';
import { CartController } from './cart.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GIO_HANG.name, schema: GIO_HANGSchema },
    ]),
    RedisModule,
    ProductModule,
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
