'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/app/shared/routes';
import { ComponentCategory, getCategoryPath } from '@/app/components/helpers/type';

/** SPA 기반 네비게이션 */
export default function useNavigation() {
  const router = useRouter();

  return {
    // 페이지 데이터 새로고침
    refresh: () => router.refresh(),

    // 홈으로 이동 (replace)
    goHome: () => {
      router.replace(ROUTES.HOME);
      return router.refresh();
    },

    // 뒤로가기 (불가 시 홈)
    goBack: () => {
      const isClient = typeof window !== 'undefined';
      const canGoBack = isClient && window.history.length > 1;
      if (canGoBack) return router.back();
      return router.push(ROUTES.HOME);
    },

    // 컴포넌트 카테고리 이동
    gotoComponents: (category: ComponentCategory) => router.push(getCategoryPath(category)),

    // 게시글 이동
    gotoPost: (id: string) => router.push(ROUTES.post(id)),

    // 방 이동
    gotoRoom: (id: string) => router.push(ROUTES.room(id)),

    // 게임 이동
    gotoGame: (roomId: string, gameId: string) => router.replace(ROUTES.game(roomId, gameId)),

    // 게임 랭킹 이동
    gotoGameRanking: (roomId: string, gameId: string) =>
      router.replace(ROUTES.ranking(roomId, gameId)),

    // 방 게임 목록 이동
    gotoRoomGameList: (roomId: string) => router.push(`/room/${roomId}/game`),

    // 방 replace 이동
    gotoRoomReplace: (id: string) => router.replace(ROUTES.room(id)),

    // 랭킹 이동
    gotoRanking: (gameId: string) => router.push(`/ranking/${gameId}`),
  };
}

/** 강제 네비게이션 */

// 브라우저 강제 새로고침
export const refresh = () => {
  window.location.reload();
};

// 홈 강제 이동
export const goHome = () => {
  window.location.href = ROUTES.HOME;
};

// 방 강제 이동
export const gotoRoomReplace = (roomId: string) => {
  window.location.href = ROUTES.room(roomId);
};
