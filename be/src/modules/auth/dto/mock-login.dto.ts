import { IsString, IsNotEmpty } from 'class-validator';

export class MockLoginDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class MockUserResponseDto {
  id: string;
  email: string;
  nickname: string;
  profile_image: string | null;
  role: 'USER' | 'ADMIN';
}
