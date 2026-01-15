import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { toUuid } from '@src/common/utils/user-id';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  /**
   * userId로 사용자 정보 조회
   * @param userId 원본 ID('J001') 또는 UUID 형식
   * @returns 사용자 정보 (id, nickname, profile_image)
   * @throws NotFoundException 사용자를 찾을 수 없는 경우
   */
  async getUserById(userId: string): Promise<{ id: string; nickname: string; profile_image: string | null }> {
    const uuid = toUuid(userId);
    const user = await this.userRepository.findOne({
      where: { id: uuid },
      select: ['id', 'nickname', 'profile_image'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      profile_image: user.profile_image,
    };
  }

  /**
   * userId로 사용자 정보 조회 (role 포함)
   * 채팅 등에서 사용자 정보와 role이 모두 필요한 경우 사용
   * @param userId 원본 ID('J001') 또는 UUID 형식
   * @returns 사용자 정보 (id, nickname, profile_image, role)
   * @throws NotFoundException 사용자를 찾을 수 없는 경우
   */
  async getUserWithRole(userId: string): Promise<{
    id: string;
    nickname: string;
    profile_image: string | null;
    role: string;
  }> {
    const uuid = toUuid(userId);
    const user = await this.userRepository.findOne({
      where: { id: uuid },
      select: ['id', 'nickname', 'profile_image', 'role'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return {
      id: user.id,
      nickname: user.nickname,
      profile_image: user.profile_image,
      role: user.role,
    };
  }
}
