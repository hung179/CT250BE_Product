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
  // Tải ảnh bìa sản phẩm
  async uploadProductImageCover(
    productId: string,
    anh_SP: Express.Multer.File
  ): Promise<{ anh_SP_uploaded: { public_id: string; url: string } }> {
    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        const publicId = `${productId}`;

        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `Product/${productId}`, public_id: publicId },
          (error, result) => {
            if (error) return reject(error);
            resolve({ public_id: result!.public_id, url: result!.url });
          }
        );

        toStream(anh_SP.buffer).pipe(uploadStream);
      }
    ).then((anh_SP_uploaded) => ({ anh_SP_uploaded }));
  }

  // Tải ảnh sản phẩm
  async uploadProductImages(
    productId: string,
    anh_SP: Express.Multer.File[]
  ): Promise<{ anh_SP_uploaded: { public_id: string; url: string }[] }> {
    const uploadPromises_SP = anh_SP.map(
      (file) =>
        new Promise<UploadApiResponse | UploadApiErrorResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: `Product/${productId}` },
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

    const anh_SP_uploaded = Images_SP.filter(
      (img): img is UploadApiResponse => 'public_id' in img && 'url' in img
    ).map((img) => ({ public_id: img.public_id, url: img.url }));

    return { anh_SP_uploaded };
  }

  // Tải ảnh tùy chọn sản phẩm
  async uploadProductOptionImages(
    productId: string,
    anh_TC: Express.Multer.File[],
    idTuyChon: string[]
  ): Promise<{ anh_TC_uploaded: { public_id: string; url: string }[] }> {
    const uploadPromises_TC = anh_TC.map(
      (file, index) =>
        new Promise<UploadApiResponse | UploadApiErrorResponse>(
          (resolve, reject) => {
            const publicId = `${idTuyChon[index]}`;

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

    const Images_TC = await Promise.all(uploadPromises_TC);

    const anh_TC_uploaded = Images_TC.filter(
      (img): img is UploadApiResponse => 'public_id' in img && 'url' in img
    ).map((img) => ({ public_id: img.public_id, url: img.url }));

    return { anh_TC_uploaded };
  }

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      const { resources } = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
      });

      if (resources.length > 0) {
        const publicIds = resources.map((file) => file.public_id);
        await cloudinary.api.delete_resources(publicIds);
      }

      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      console.error(`Lỗi xóa thư mục ${folderPath}:`, error);
    }
  }

  async deleteImages(imagesPublicId: string[]): Promise<void> {
    if (!imagesPublicId || imagesPublicId.length === 0) return;

    try {
      await cloudinary.api.delete_resources(imagesPublicId);
    } catch (error) {
      console.error('Lỗi khi xóa ảnh trên Cloudinary:', error);
      throw new Error('Không thể xóa ảnh trên Cloudinary');
    }
  }

  async updateImage(
    publicId: string,
    newImage: Express.Multer.File
  ): Promise<{ public_id: string; url: string }> {
    return new Promise<{ public_id: string; url: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { public_id: publicId, overwrite: true },
          (error, result) => {
            if (error) return reject(error);
            resolve({ public_id: result!.public_id, url: result!.url });
          }
        );

        toStream(newImage.buffer).pipe(uploadStream);
      }
    ).then((result) => result);
  }

  async updateImages(
    publicIds: string[],
    newImages: Express.Multer.File[]
  ): Promise<{ public_id: string; url: string }[]> {
    if (publicIds.length !== newImages.length) {
      throw new Error('Số lượng publicId và số lượng ảnh không khớp!');
    }

    const uploadPromises = publicIds.map((publicId, index) => {
      return new Promise<{ public_id: string; url: string }>(
        (resolve, reject) => {
          console.log('publicId', publicId);
          const uploadStream = cloudinary.uploader.upload_stream(
            { public_id: publicId, overwrite: true },
            (error, result) => {
              if (error) return reject(error);
              resolve({
                public_id: result!.public_id,
                url: result!.secure_url,
              });
            }
          );
          toStream(newImages[index].buffer).pipe(uploadStream);
        }
      );
    });

    return await Promise.all(uploadPromises);
  }
}
