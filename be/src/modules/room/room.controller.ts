import {
  Body,
  Controller,
  Delete,
  Param,
  Get,
  Patch,
  Post,
  HttpException,
  HttpStatus,
  Query,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomRequestDto, JoinRoomRequestDto, RoomJoinDto, RoomSearchQueryDto } from './dto/room.dto';
import {
  RoomCreateResponseDto,
  RoomDeleteResponseDto,
  RoomListResponseDto,
  RoomReadResponseDto,
  RoomJoinInfoResponseDto,
} from './dto/room-response.dto';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { ApiResponseMessage } from '@src/common/decorators/api-response-message.decorator';
import { JwtAuthGuard } from '@src/modules/auth/jwt-auth.guard';

@Controller('rooms')
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly roomGateway: RoomGateway,
  ) {}

  /**
   * 대화방 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiResponseMessage('대화방이 성공적으로 생성되었습니다.')
  async createRoom(@Req() req, @Body() dto: RoomRequestDto): Promise<RoomCreateResponseDto> {
    const userId = req.user.id;

    return await this.roomService.createRoom(userId, dto);
  }

  /**
   * 대화방 수정
   */
  @Patch(':roomId')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMessage('대화방이 성공적으로 수정되었습니다.')
  async updateRoom(
    @Req() req,
    @Param('roomId') roomId: string,
    @Body() dto: RoomRequestDto,
  ): Promise<RoomCreateResponseDto> {
    const userId = req.user.id;

    return await this.roomService.updateRoom(userId, roomId, dto);
  }

  /**
   * 대화방 삭제
   */
  @Delete(':roomId')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMessage('대화방이 성공적으로 삭제되었습니다.')
  async deleteRoom(@Req() req, @Param('roomId') roomId: string): Promise<RoomDeleteResponseDto> {
    const userId = req.user.id;
    return await this.roomService.deleteRoom(userId, roomId, this.roomGateway.server);
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
   * 내가 참여 중인 로컬 방 조회
   * GET /api/rooms/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponseMessage('참여 중인 방 조회에 성공 했습니다.')
  async getMyCurrentRoom(@Req() req): Promise<{ roomId: string | null }> {
    const userId = req.user.id;
    const roomId = await this.roomService.getUserLocalRoom(userId);
    return { roomId };
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
  @UseGuards(JwtAuthGuard)
  @ApiResponseMessage('방 입장 정보 조회에 성공 했습니다.')
  async getRoomJoinInfo(@Req() req, @Param('id') roomId: string): Promise<RoomJoinInfoResponseDto> {
    const userId = req.user.id;

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
  @UseGuards(JwtAuthGuard)
  @ApiResponseMessage('입장 가능한 방입니다.')
  async validateJoin(@Req() req, @Param('id') roomId: string, @Body() dto: JoinRoomRequestDto): Promise<RoomJoinDto> {
    const userId = req.user.id;

    await this.roomService.validateJoinRoom(roomId, userId, dto.password);

    return { room_id: roomId };
  }
}
