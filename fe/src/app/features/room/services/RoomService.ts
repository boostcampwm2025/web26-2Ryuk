import { HttpService } from '@/app/services/http.service';
import {
  RoomDto,
  RoomEditDto,
  RoomJoinDto,
  RoomJoinInfoDto,
  RoomsListDto,
} from '@/app/features/room/dtos/type';
import { authStore } from '@/app/features/user/stores/auth';
import { ApiResponse, IdDto } from './type';
import { showErrorToast } from '@/app/components/shared/toast/useToast';

export class RoomService {
  async getRooms(): Promise<RoomsListDto> {
    const uri = '/api/rooms/all';
    const response = await HttpService.get<ApiResponse<RoomsListDto>>(uri);

    if (!response.success) throw new Error(response.message);
    return { rooms: response.data?.rooms || [] };
  }

  async searchRooms(keyword: string): Promise<RoomsListDto> {
    const uri = `/api/rooms/search?keyword=${keyword}`;
    const response = await HttpService.get<ApiResponse<RoomsListDto>>(uri);
    if (!response.success) throw new Error(response.message);
    return { rooms: response.data?.rooms || [] };
  }

  async getRoom(roomId: string): Promise<RoomDto> {
    const uri = `/api/rooms/${roomId}`;
    const response = await HttpService.get<ApiResponse<RoomDto>>(uri);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async getRoomJoinInfo(roomId: string): Promise<RoomJoinInfoDto> {
    const uri = `/api/rooms/${roomId}/join`;
    const token = authStore.getState().token || undefined;
    const response = await HttpService.get<ApiResponse<RoomJoinInfoDto>>(uri, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async createRoom(data: RoomEditDto): Promise<RoomDto> {
    const uri = '/api/rooms';
    const token = authStore.getState().token || undefined;
    const response = await HttpService.post<ApiResponse<RoomDto>>(uri, data, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async updateRoom(roomId: string, data: RoomEditDto): Promise<RoomDto> {
    const uri = `/api/rooms/${roomId}`;
    const token = authStore.getState().token || undefined;
    const response = await HttpService.patch<ApiResponse<RoomDto>>(uri, data, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const uri = `/api/rooms/${roomId}`;
    const token = authStore.getState().token || undefined;
    const response = await HttpService.delete<ApiResponse<IdDto>>(uri, token);
    if (!response.success) throw new Error(response.message);
  }

  async validateJoin(roomId: string, password: string = ''): Promise<RoomJoinDto> {
    const uri = `/api/rooms/${roomId}/validate-join`;
    const data = { password };
    const token = authStore.getState().token || undefined;
    const response = await HttpService.post<ApiResponse<RoomJoinDto>>(uri, data, token);
    if (!response.success || !response.data) throw new Error(response.message);
    return response.data;
  }
}

const roomService = new RoomService();
export default roomService;
