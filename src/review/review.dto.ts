import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  idSanPham_DG!: string;

  @IsString()
  idKhachHang_DG!: string;

  @IsString()
  idHoaDon_DG!: string;

  @IsString()
  noiDung_DG?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  diem_DG!: number;
}
