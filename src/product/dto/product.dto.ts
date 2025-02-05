import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsDefined,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

class TTChiTietSPDto {
  @IsMongoId()
  thuocTinh_CTSP!: string;

  @IsDefined()
  giaTri_CTSP!: unknown;
}

class TuyChonPLDto {
  @IsString()
  tenTuyChon_TC!: string;

  @IsNumber()
  giaBan_TC!: number;

  @IsNumber()
  khoHang_TC!: number;
}

class PhanLoaiSPDto {
  @IsString()
  tenPhanLoai_PL!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TuyChonPLDto)
  tuyChon_PL!: TuyChonPLDto[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  ten_SP!: string;

  @IsMongoId()
  @IsNotEmpty()
  nganhHang_SP!: string;

  @IsString()
  @IsNotEmpty()
  moTa_SP!: string;

  @IsNumber()
  trongLuongSP!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TTChiTietSPDto)
  ttChiTiet_SP!: TTChiTietSPDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhanLoaiSPDto)
  phanLoai_SP?: PhanLoaiSPDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
