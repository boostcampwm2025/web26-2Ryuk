import {
  Body,
  Controller,
  Delete,
  Headers,
  Param,
  Get,
  Patch,
  Post,
  HttpException,
  UnauthorizedException,
  HttpStatus,
  Query,
  Logger,
} from '@nestjs/common';
import { MockAuthService } from '@src/modules/auth/mock-auth.service';
import {
  RoomRequestDto,
  RoomCreateResponseDto,
  RoomDeleteResponseDto,
  JoinRoomRequestDto,
  RoomJoinDto,
  RoomListResponseDto,
  RoomSearchQueryDto,
  RoomReadResponseDto,
  RoomJoinInfoResponseDto,
} from './dto/room.dto';
import { RoomService } from './room.service';
import { ApiResponseMessage } from '@src/common/decorators/api-response-message.decorator';
import { LOG, logMessage } from '@src/common/utils/log-messages';

@Controller('rooms')
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly authService: MockAuthService,
  ) {}

  /**
   * 대화방 생성
   */
  @Post()
  @ApiResponseMessage('대화방이 성공적으로 생성되었습니다.')
  async createRoom(
    @Headers('authorization') authHeader: string,
    @Body() dto: RoomRequestDto,
  ): Promise<RoomCreateResponseDto> {
    if (!authHeader) throw new UnauthorizedException('인증이 필요합니다.');

    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyMockToken(token);

    if (!payload) throw new UnauthorizedException('유효하지 않은 토큰입니다.');

    const userId = payload.userId;

    return await this.roomService.createRoom(userId, dto);
  }

  /**
   * 대화방 수정
   */
  @Patch(':roomId')
  @ApiResponseMessage('대화방이 성공적으로 수정되었습니다.')
  async updateRoom(
    @Headers('authorization') authHeader: string,
    @Param('roomId') roomId: string,
    @Body() dto: RoomRequestDto,
  ): Promise<RoomCreateResponseDto> {
    if (!authHeader) throw new UnauthorizedException('인증이 필요합니다.');

    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyMockToken(token);

    if (!payload) throw new UnauthorizedException('유효하지 않은 토큰입니다.');

    const userId = payload.userId;

    return await this.roomService.updateRoom(userId, roomId, dto);
  }

  /**
   * 대화방 삭제
   */
  @Delete(':roomId')
  @ApiResponseMessage('대화방이 성공적으로 삭제되었습니다.')
  async deleteRoom(
    @Headers('authorization') authHeader: string,
    @Param('roomId') roomId: string,
  ): Promise<RoomDeleteResponseDto> {
    if (!authHeader) throw new UnauthorizedException('인증이 필요합니다.');

    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyMockToken(token);

    if (!payload) throw new UnauthorizedException('유효하지 않은 토큰입니다.');

    const userId = payload.userId;

    return await this.roomService.deleteRoom(userId, roomId);
  }

  /**
   * 로컬 방 목록 조회 -> GET /api/rooms/all
   */
  @Get('all')
  @ApiResponseMessage('방 목록 조회에 성공 했습니다.')
  async getLocalRooms(): Promise<RoomListResponseDto> {
    return await this.roomService.getLocalRooms();
  }

  /**
   * 로컬 방 검색 -> GET /api/rooms/search?keyword=검색어
   */
  @Get('search')
  @ApiResponseMessage('방 검색 조회에 성공 했습니다.')
  async searchLocalRooms(@Query() query: RoomSearchQueryDto): Promise<RoomListResponseDto> {
    const keyword = query.keyword || '';
    return await this.roomService.searchLocalRooms(keyword);
  }

  /**
   * 로컬 방 상세 -> GET /api/rooms/:id
   */
  @Get(':id')
  @ApiResponseMessage('방 상세 조회에 성공 했습니다.')
  async getRoom(@Param('id') roomId: string): Promise<RoomReadResponseDto> {
    return await this.roomService.getRoom(roomId);
  }

  /**
   * 대화방 입장 정보 조회
   */
  @Get(':id/join')
  @ApiResponseMessage('방 입장 정보 조회에 성공 했습니다.')
  async getRoomJoinInfo(
    @Headers('authorization') authHeader: string,
    @Param('id') roomId: string,
  ): Promise<RoomJoinInfoResponseDto> {
    if (!authHeader) throw new UnauthorizedException('인증이 필요합니다.');

    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyMockToken(token);

    if (!payload) throw new UnauthorizedException('유효하지 않은 토큰입니다.');

    const userId = payload.userId;
    return await this.roomService.getRoomJoinInfo(userId, roomId);
  }

  /**
   * postman 에러 테스트용 -> GET /api/rooms/test/error
   */
  @Get('test/error')
  async testError(): Promise<void> {
    throw new HttpException('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * 방 입장 가능 여부 검증
   */
  @Post(':id/validate-join')
  @ApiResponseMessage('입장 가능한 방입니다.')
  async validateJoin(
    @Param('id') roomId: string,
    @Body() dto: JoinRoomRequestDto,
    @Headers('authorization') authHeader?: string,
  ): Promise<RoomJoinDto> {
    if (!authHeader) {
      logMessage(this.logger, LOG.ROOM.UNAUTH_API_ACCESS_JOIN(roomId));
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = this.authService.verifyMockToken(token);

    if (!payload) {
      logMessage(this.logger, LOG.ROOM.INVALID_TOKEN_API_JOIN(roomId));
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    await this.roomService.validateJoinRoom(roomId, payload.userId, dto.password);

    return { room_id: roomId };
  }
}
