/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
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
  @IsOptional()
  thuocTinh_CTSP!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    value !== null && value !== undefined ? String(value) : ''
  )
  giaTri_CTSP!: string;
}

class TuyChonPLDto {
  @IsString()
  ten_TC!: string;
}

class NganhHangDto {
  @IsString()
  cap1_NH!: string;

  @IsString()
  @IsOptional()
  cap2_NH!: string;

  @IsString()
  @IsOptional()
  cap3_NH!: string;
}

class PhanLoaiSPDto {
  @IsString()
  ten_PL!: string;

  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @Type(() => TuyChonPLDto)
  tuyChon_PL!: TuyChonPLDto[];
}

class TTBanHangSPDto {
  @IsOptional()
  @IsNumber()
  tuyChonPhanLoai1_BH?: string;

  @IsOptional()
  @IsNumber()
  tuyChonPhanLoai2_BH?: string;

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
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @MinLength(10)
  ten_SP!: string;

  @Type(() => NganhHangDto)
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  nganhHang_SP!: NganhHangDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  @MinLength(100)
  moTa_SP!: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @Type(() => TTChiTietSPDto)
  ttChiTiet_SP!: TTChiTietSPDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @Type(() => TTBanHangSPDto)
  ttBanHang_SP!: TTBanHangSPDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  @Type(() => PhanLoaiSPDto)
  phanLoai_SP?: PhanLoaiSPDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value
  )
  ttAnhXoa_SP?: string[];

  @IsOptional()
  @IsBoolean()
  daAn_SP?: boolean;
}
