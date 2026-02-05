export class UserInfoResponseDto {
  id: string;
  nickname: string;
  profile_image: string | null;

  constructor(data: { id: string; nickname: string; profile_image: string | null }) {
    this.id = data.id;
    this.nickname = data.nickname;
    this.profile_image = data.profile_image;
  }
}

export class UserWithRoleResponseDto extends UserInfoResponseDto {
  role: string;

  constructor(data: { id: string; nickname: string; profile_image: string | null; role: string }) {
    super(data);
    this.role = data.role;
  }
}

export class GetMeResponseDto {
  id: string;
  nickname: string;
  profile_image: string;

  constructor(data: { id: string; nickname: string; profile_image: string | null }) {
    this.id = data.id;
    this.nickname = data.nickname;
    this.profile_image = data.profile_image || '';
  }
}

export class RefreshTokenResponseDto {
  access_token: string;

  constructor(accessToken: string) {
    this.access_token = accessToken;
  }
}

export class MockLoginResponseDto {
  access_token: string;
  user: UserInfoResponseDto;

  constructor(accessToken: string, user: UserInfoResponseDto) {
    this.access_token = accessToken;
    this.user = user;
  }
}
