import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Danh_Gia, Danh_GiaSchema } from './review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Danh_Gia.name, schema: Danh_GiaSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
