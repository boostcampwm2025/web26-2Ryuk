/**
 * MSW 핸들러 정의
 *
 * 개발 환경에서 API 요청을 모킹하기 위한 핸들러들을 정의
 */
import { http, HttpResponse } from 'msw';
import postListCardMock from './data/postListCard.json';
import profilesMock from './data/profiles.json';

export const handlers = [
  // Popular Posts API
  http.get('/api/posts/popular', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    // limit 파라미터가 있으면 posts를 제한
    if (limit) {
      const limitNum = parseInt(limit, 10);
      return HttpResponse.json({
        ...postListCardMock,
        posts: postListCardMock.posts.slice(0, limitNum),
      });
    }

    return HttpResponse.json(postListCardMock);
  }),

  // User Profile API (특정 사용자 정보)
  http.get('/api/users/:userId/profile', ({ params }) => {
    const { userId } = params;
    const profile = profilesMock.find((p) => p.id === userId);

    if (!profile) return HttpResponse.json({ error: 'Profile not found' }, { status: 404 });
    return HttpResponse.json(profile);
  }),
];
