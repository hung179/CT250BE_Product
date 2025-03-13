/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  v2 as cloudinary,
} from 'cloudinary';
import * as toStream from 'buffer-to-stream';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  // Tải ảnh bìa sản phẩm
  async uploadProductImageCover(
    productId: string,
    anh_SP: Express.Multer.File
  ): Promise<{ anh_SP_uploaded: { public_id: string; url: string } }> {
    if (!anh_SP)
      throw new BadRequestException('Không có ảnh bìa được cung cấp');

    try {
      return new Promise<{ public_id: string; url: string }>(
        (resolve, reject) => {
          const publicId = `${productId}`;
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `Products/${productId}`, public_id: publicId },
            (error, result) => {
              if (error)
                return reject(
                  new InternalServerErrorException(
                    'Lỗi tải ảnh bìa sản phẩm lên Cloudinary'
                  )
                );
              resolve({ public_id: result!.public_id, url: result!.url });
            }
          );
          streamifier.createReadStream(anh_SP.buffer).pipe(uploadStream);
        }
      ).then((anh_SP_uploaded) => ({ anh_SP_uploaded }));
    } catch (error) {
      throw new InternalServerErrorException('Không thể tải ảnh');
    }
  }

  // Tải ảnh sản phẩm
  async uploadProductImages(
    productId: string,
    anh_SP: Express.Multer.File[]
  ): Promise<{ anh_SP_uploaded: { public_id: string; url: string }[] }> {
    if (!anh_SP || anh_SP.length === 0)
      throw new BadRequestException('Không có ảnh sản phẩm được cung cấp');

    try {
      const uploadPromises_SP = anh_SP.map(
        (file) =>
          new Promise<UploadApiResponse | UploadApiErrorResponse>(
            (resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: `Products/${productId}` },
                (error, result) => {
                  if (error)
                    return reject(
                      new InternalServerErrorException(
                        'Lỗi tải ảnh sản phẩm lên Cloudinary'
                      )
                    );
                  resolve(result!);
                }
              );
              streamifier.createReadStream(file.buffer).pipe(uploadStream);
            }
          )
      );

      const Images_SP = await Promise.all(uploadPromises_SP);
      const anh_SP_uploaded = Images_SP.filter(
        (img): img is UploadApiResponse => 'public_id' in img && 'url' in img
      ).map((img) => ({ public_id: img.public_id, url: img.url }));

      return { anh_SP_uploaded };
    } catch (error) {
      throw new InternalServerErrorException('Không thể tải ảnh');
    }
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
      throw new InternalServerErrorException(`Lỗi xóa thư mục ${folderPath}`);
    }
  }

  async deleteImages(imagesPublicId: string[]): Promise<void> {
    if (!imagesPublicId || imagesPublicId.length === 0) return;

    try {
      await cloudinary.api.delete_resources(imagesPublicId);
    } catch (error) {
      throw new InternalServerErrorException('Không thể xóa ảnh');
    }
  }
}
