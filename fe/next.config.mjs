/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { // GitHub User Content 이미지 추가
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      { // Google User Content 이미지 추가
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
  async rewrites() {
    const apiServerUrl = process.env.NEXT_PUBLIC_API_SERVER_URL;
    if (!apiServerUrl) throw new Error('환경변수가 없습니다: NEXT_PUBLIC_API_SERVER_URL');
    return [
      {
        source: '/api/:path*',
        destination: `${apiServerUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;