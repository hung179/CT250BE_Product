/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsMongoId,
  IsBoolean,
  MaxLength,
  MinLength,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

class TTChiTietSPDto {
  @IsMongoId()
  thuocTinh_CTSP!: string;

  @IsString()
  giaTri_CTSP!: string;
}

class TuyChonPLDto {
  @IsString()
  ten_TC!: string;

  @IsBoolean()
  anh_TC?: boolean;
}

class PhanLoaiSPDto {
  @IsString()
  ten_PL!: string;

  @IsString()
  cap_PL!: number;

  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => TuyChonPLDto)
  tuyChon_PL!: TuyChonPLDto[];
}

class TTBanHangSPDto {
  @IsOptional()
  @IsString()
  tuyChonPhanLoai1_BH?: string;

  @IsOptional()
  @IsString()
  tuyChonPhanLoai2_BH?: string;

  @Min(1000)
  @Max(120000000)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  giaBan_TC?: number;

  @Min(1)
  @Max(999999)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  khoHang_TC?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Min(1)
  @Max(99999999)
  ten_SP!: string;

  @IsMongoId()
  @IsNotEmpty()
  nganhHang_SP!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  @MinLength(100)
  moTa_SP!: string;

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber()
  @Min(1)
  @Max(999999)
  trongLuong_SP!: number;

  @IsString()
  kichThuoc_SP!: string;

  @IsArray()
  @MinLength(1)
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => TTChiTietSPDto)
  ttChiTiet_SP!: TTChiTietSPDto[];

  @MinLength(1)
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => TTBanHangSPDto)
  ttBanHang_SP?: TTBanHangSPDto[];

  @MaxLength(2)
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => PhanLoaiSPDto)
  phanLoai_SP?: PhanLoaiSPDto[];
}

// Cập nhật DTO để chuyển dữ liệu từ form-data thành định dạng đúng
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  ttAnhCapNhat_SP?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  ttAnhCapNhat_TC?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  ttAnhXoa_SP?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  ttAnhXoa_TC?: string[];

  @IsOptional()
  @IsBoolean()
  daAn_SP?: boolean;
}
