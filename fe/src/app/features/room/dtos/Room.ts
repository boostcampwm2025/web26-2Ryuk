import {
  RoomDto,
  RoomData,
  RoomEditDto,
  RoomEditData,
  RoomJoinInfoDto,
  RoomJoinInfoData,
  SimpleParticipant,
} from './type';
export class RoomConverter {
  static toData(dto: RoomDto): RoomData {
    return {
      id: dto.id,
      title: dto.title,
      tags: dto.tags,
      hostId: dto.host_id,
      currentParticipants: dto.current_participants,
      maxParticipants: dto.max_participants,
      isMicAvailable: dto.is_mic_available,
      isPrivate: dto.is_private,
      participants: dto.participants.map((p) => ({
        userId: p.user_id,
        nickname: p.nickname,
        profileImage: p.profile_image,
      })),
      createDate: new Date(dto.create_date),
    };
  }
  static toDto(data: RoomData): RoomDto {
    return {
      id: data.id,
      title: data.title,
      tags: data.tags,
      host_id: data.hostId,
      current_participants: data.currentParticipants,
      max_participants: data.maxParticipants,
      is_mic_available: data.isMicAvailable,
      is_private: data.isPrivate,
      participants: data.participants.map((p) => ({
        user_id: p.userId,
        nickname: p.nickname,
        profile_image: p.profileImage,
      })),
      create_date: data.createDate.toISOString(),
    };
  }

  static editToDto(data: RoomEditData): RoomEditDto {
    return {
      title: data.title,
      tags: data.tags,
      password: data.password,
      max_participants: data.maxParticipants,
      is_mic_available: data.isMicAvailable,
      is_private: data.isPrivate,
    };
  }
  static editToData(dto: RoomEditDto): RoomEditData {
    return {
      title: dto.title,
      tags: dto.tags,
      password: dto.password,
      maxParticipants: dto.max_participants,
      isMicAvailable: dto.is_mic_available,
      isPrivate: dto.is_private,
    };
  }

  static toJoinInfoDto(data: RoomJoinInfoData): RoomJoinInfoDto {
    return {
      title: data.title,
      tags: data.tags,
      is_mic_available: data.isMicAvailable,
      is_private: data.isPrivate,
      is_member: data.isMember,
    };
  }

  static toJoinInfoData(dto: RoomJoinInfoDto): RoomJoinInfoData {
    return {
      title: dto.title,
      tags: dto.tags,
      isMicAvailable: dto.is_mic_available,
      isPrivate: dto.is_private,
      isMember: dto.is_member,
    };
  }
}
