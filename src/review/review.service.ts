import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DANH_GIA } from './review.schema';
import { CreateReviewDto } from './review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(DANH_GIA.name) private reviewModel: Model<DANH_GIA>
  ) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<DANH_GIA> {
    const review = new this.reviewModel(createReviewDto);
    return review.save();
  }

  async getReviewsByProduct(
    productId: string,
    page: number,
    limit: number
  ): Promise<DANH_GIA[]> {
    return this.reviewModel
      .find({ idSanPham_DG: productId })
      .sort({ ngayTao_DG: -1 })
      .skip(page * limit)
      .limit(limit)
      .exec();
  }

  async deleteReview(id: string): Promise<void> {
    const result = await this.reviewModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Review không tồn tại');
    }
  }

  async deleteAllReviewProduct(productId: string): Promise<void> {
    await this.reviewModel.deleteMany({ idSanPham_DG: productId });
  }
}
