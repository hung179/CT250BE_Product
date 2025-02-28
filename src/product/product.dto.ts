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

  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber()
  @Min(1)
  @Max(999999)
  trongLuong_BH!: number;

  @IsString()
  kichThuoc_BH!: string;

  @Min(1000)
  @Max(120000000)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  giaBan_BH?: number;

  @Min(1)
  @Max(999999)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  khoHang_BH?: number;

  @IsBoolean()
  coAnh_BH?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @MinLength(10)
  ten_SP!: string;

  @IsMongoId()
  @IsNotEmpty()
  nganhHang_SP!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  @MinLength(100)
  moTa_SP!: string;

  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => TTChiTietSPDto)
  ttChiTiet_SP!: TTChiTietSPDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => TTBanHangSPDto)
  ttBanHang_SP!: TTBanHangSPDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @ValidateNested({ each: true })
  @Type(() => PhanLoaiSPDto)
  phanLoai_SP?: PhanLoaiSPDto[];
}

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
  ttAnhCapNhat_BH?: string[];

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
  ttAnhXoa_BH?: string[];

  @IsOptional()
  @IsBoolean()
  daAn_SP?: boolean;
}
