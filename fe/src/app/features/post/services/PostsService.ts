import { HttpService } from '@/app/services/http.service';
import { API_BASE } from '@/app/services/api.constants';
import { PopularPostsDto } from './type';

class PostService {
  async getPopularPosts(limit: number = 2): Promise<PopularPostsDto> {
    // TODO: 실제 API 엔드포인트로 교체
    const uri = `${API_BASE}/posts/popular?limit=${limit}`;
    const response = await HttpService.get<PopularPostsDto>(uri);

    return {
      posts: response.posts,
      totalCount: response.totalCount,
    };
  }
}

const postsService = new PostService();
export default postsService;
