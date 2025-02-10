import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Danh_Gia } from './review.schema';
import { CreateReviewDto } from './review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Danh_Gia.name) private reviewModel: Model<Danh_Gia>
  ) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<Danh_Gia> {
    const review = new this.reviewModel(createReviewDto);
    return review.save();
  }

  async getReviewsByProduct(
    productId: string,
    page: number,
    limit: number
  ): Promise<Danh_Gia[]> {
    return this.reviewModel
      .find({ idSanPham_DG: productId })
      .sort({ ngayTao_DG: -1 })
      .skip(page * limit)
      .limit(limit)
      .exec();
  }

  async getReviewsByRating(
    productId: string,
    rating: number,
    page: number,
    limit: number
  ): Promise<Danh_Gia[]> {
    return this.reviewModel
      .find({ idSanPham_DG: productId, diem_DG: rating })
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
}
