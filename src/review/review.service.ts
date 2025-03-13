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

  async createReview(
    createReviewDto: CreateReviewDto
  ): Promise<{ success: boolean; data?: DANH_GIA; error?: any }> {
    try {
      const review = new this.reviewModel(createReviewDto);
      const savedReview = await review.save();
      return { success: true, data: savedReview };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getReviewsByProduct(
    productId: string,
    page: number = 0,
    limit: number = 12
  ): Promise<{ success: boolean; data?: DANH_GIA[]; error?: any }> {
    try {
      const reviews = await this.reviewModel
        .find({ idSanPham_DG: productId })
        .sort({ ngayTao_DG: -1 })
        .skip(page * limit)
        .limit(limit)
        .exec();
      if (!reviews) {
        throw new NotFoundException('Review không tồn tại');
      }
      return { success: true, data: reviews };
    } catch (error) {
      return { success: false, error };
    }
  }

  async deleteReview(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const result = await this.reviewModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('Review không tồn tại');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async deleteAllReviewProduct(
    productId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await this.reviewModel.deleteMany({ idSanPham_DG: productId });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
}
