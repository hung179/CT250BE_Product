import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern('review_create')
  async createReview(@Payload() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @MessagePattern('review_get-product')
  async getReviewsProduct(
    @Payload() data: { productId: string; page?: number; limit?: number }
  ) {
    const { productId, page = 0, limit = 10 } = data;
    return this.reviewService.getReviewsByProduct(
      productId,
      Number(page),
      Number(limit)
    );
  }

  @MessagePattern('review_delete-all-product')
  async deleteReview(@Payload() id: string) {
    return this.reviewService.deleteReview(id);
  }
}
