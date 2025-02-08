/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as toStream from 'buffer-to-stream';

@Injectable()
export class CloudinaryService {
  async uploadImages(
    product: any,
    anh_SP: Express.Multer.File[],
    anh_TC: Express.Multer.File[]
  ): Promise<{
    anh_SP_uploaded: { public_id: string; url: string }[];
    anh_TC_uploaded: { public_id: string; url: string }[];
  }> {
    const productId = product._id.toString();

    const uploadPromises_SP = anh_SP.map(
      (file, index) =>
        new Promise<UploadApiResponse | UploadApiErrorResponse>(
          (resolve, reject) => {
            const publicId = `${productId}_${(index + 1).toString()}`;
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `Product/${productId}`, public_id: publicId },
              (error, result) => {
                if (error) return reject(error);
                resolve(result!);
              }
            );
            toStream(file.buffer).pipe(uploadStream);
          }
        )
    );

    const tuyChonAnh = product.phanLoai_SP
      ?.filter((pl, index) => index === 0) // Chỉ lấy phân loại cấp 1 (phần tử đầu tiên)
      .flatMap((pl) => pl.tuyChon_PL) // Gộp tất cả tùy chọn thành một mảng
      .filter((tc) => tc.coAnh_TC === true); // Chỉ giữ tùy chọn có ảnh

    const uploadPromises_TC = anh_TC.map(
      (file, index) =>
        new Promise<UploadApiResponse | UploadApiErrorResponse>(
          (resolve, reject) => {
            // Lấy tên tùy chọn tương ứng với ảnh
            const tenTuyChon = tuyChonAnh[index].ten_TC
              .normalize('NFD') // Tách dấu khỏi ký tự
              .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
              .replace(/\s+/g, '-') // Xóa khoảng trắng Thay khoảng trắng bằng "_"
              .replace(/đ/g, 'd') // Chuyển "đ" thành "d"
              .replace(/Đ/g, 'D') // Chuyển "Đ" thành "D"
              .toLowerCase(); // Chuyển về chữ thường

            // Tạo `publicId`
            const publicId = `${productId}_${tenTuyChon}`;

            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `Product/${productId}`, public_id: publicId },
              (error, result) => {
                if (error) return reject(error);
                resolve(result!);
              }
            );

            toStream(file.buffer).pipe(uploadStream);
          }
        )
    );

    const Images_SP = await Promise.all(uploadPromises_SP);
    const Images_TC = await Promise.all(uploadPromises_TC);

    // Chỉ lấy ảnh tải lên thành công
    const anh_SP_uploaded = Images_SP.filter(
      (img): img is UploadApiResponse => 'public_id' in img && 'url' in img
    ).map((img) => ({ public_id: img.public_id, url: img.url }));

    const anh_TC_uploaded = Images_TC.filter(
      (img): img is UploadApiResponse => 'public_id' in img && 'url' in img
    ).map((img) => ({ public_id: img.public_id, url: img.url }));

    return { anh_SP_uploaded, anh_TC_uploaded };
  }

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      // 1. Lấy danh sách tất cả ảnh trong thư mục
      const { resources } = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath, // Lấy tất cả ảnh trong thư mục
      });

      if (resources.length > 0) {
        // 2. Xóa tất cả ảnh trong thư mục
        const publicIds = resources.map((file) => file.public_id);
        await cloudinary.api.delete_resources(publicIds);
      }

      // 3. Xóa thư mục (nếu không còn ảnh)
      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      console.error(`Lỗi xóa thư mục ${folderPath}:`, error);
    }
  }
}
