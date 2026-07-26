import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateArticleCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(420)
  body!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  author?: string;
}
