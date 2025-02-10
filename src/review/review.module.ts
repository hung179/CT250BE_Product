import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { DANH_GIA, DANH_GIASchema } from './review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DANH_GIA.name, schema: DANH_GIASchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
