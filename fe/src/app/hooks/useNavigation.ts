'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/app/shared/routes';
import IS from '@/utils/is';
import { ComponentCategory, getCategoryPath } from '@/app/components/helpers/type';

export default function useNavigation() {
  const router = useRouter();

  return {
    refresh: () => router.refresh(),
    goHome: () => {
      router.replace(ROUTES.HOME);
      router.refresh();
    },
    goBack: () => {
      if (!IS.undefined(window) && window.history.length > 1) router.back();
      else router.push(ROUTES.HOME);
    },
    gotoComponents: (category: ComponentCategory) => {
      router.push(getCategoryPath(category));
    },
    gotoPost: (id: string) => {
      router.push(ROUTES.post(id));
    },
    gotoRoom: (id: string) => {
      router.push(ROUTES.room(id));
    },
    gotoGame: (roomId: string, gameId: string) => {
      router.push(ROUTES.game(roomId, gameId));
    },
    gotoGameRanking: (roomId: string, gameId: string) => {
      router.push(ROUTES.ranking(roomId, gameId));
    },
    gotoRoomGameList: (roomId: string) => {
      router.push(`/room/${roomId}/game`);
    },
    gotoRoomReplace: (id: string) => {
      router.replace(ROUTES.room(id));
    },
    gotoRanking: (gameId: string) => {
      router.push(`/ranking/${gameId}`);
    },
  };
}

export const refresh = () => {
  window.location.reload();
};

export const goHome = () => {
  window.location.href = ROUTES.HOME;
};

export const gotoRoomReplace = (roomId: string) => {
  window.location.href = ROUTES.room(roomId);
};
