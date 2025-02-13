import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeletedProductCode } from './deletedProductCode.schema';

@Injectable()
export class DeletedProductCodeService {
  constructor(
    @InjectModel(DeletedProductCode.name)
    private readonly deletedCodeModel: Model<DeletedProductCode>
  ) {}

  // Lưu mã đã xóa nếu nó nhỏ hơn mã lớn nhất hiện tại
  async saveDeletedCode(code: number, maxCode: number): Promise<void> {
    if (typeof maxCode === 'number' && code < maxCode) {
      await this.deletedCodeModel.create({ code });
    }
  }

  // Lấy mã sản phẩm tiếp theo
  async getNextProductCode(maxCode: number): Promise<number> {
    const deletedCode = await this.deletedCodeModel.findOneAndDelete(
      {},
      { sort: { code: 1 } }
    );

    if (deletedCode) {
      return deletedCode.code;
    }

    return typeof maxCode === 'number' ? maxCode + 1 : 1;
  }

  // Xóa các mã thừa nếu vượt quá mã lớn nhất hiện tại
  async cleanupDeletedCodes(maxCode: number): Promise<void> {
    if (maxCode === 0) {
      await this.deletedCodeModel.deleteMany({});
    } else {
      await this.deletedCodeModel.deleteMany({ code: { $gt: maxCode } });
    }
  }
}
