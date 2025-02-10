import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async createReview(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get(':id')
  async getReviewsProduct(
    @Param('id') productId: string,
    @Query('r') rating?: number,
    @Query('p') page: number = 0,
    @Query('l') limit: number = 10
  ) {
    if (rating) {
      return this.reviewService.getReviewsByRating(
        productId,
        Number(rating),
        Number(page),
        Number(limit)
      );
    } else {
      return this.reviewService.getReviewsByProduct(
        productId,
        Number(page),
        Number(limit)
      );
    }
  }

  @Delete(':id')
  async deleteReview(@Param('id') id: string) {
    return this.reviewService.deleteReview(id);
  }
}
