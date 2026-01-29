import * as data from '@/app/features/game/dtos/data';

export type PlayerJoinCallback = (data: data.GamePlayerJoinData) => void;
export type PlayerLeaveCallback = (data: data.GamePlayerLeaveData) => void;
export type RecruitCallback = (data: data.GamePlayerRecruitData) => void;
export type ReadyCallback = (data: data.GamePlayerReadyData) => void;
export type UnreadyCallback = (data: data.GamePlayerUnreadyData) => void;
export type CloseCallback = (data: data.GamePlayerCloseData) => void;
export type SelectCallback = (data: data.GamePlayerSelectData) => void;
export type StartCallback = (data: data.GamePlayerStartData) => void;
export type RealtimeCallback = (data: data.GamePlayerRealtimeData) => void;
export type ResultCallback = (data: data.GamePlayerResultData) => void;
