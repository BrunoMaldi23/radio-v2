/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const apiProxyUrl = process.env.API_PROXY_URL ?? (isProduction ? 'https://159.112.140.93.nip.io' : 'http://localhost:3001');
const icecastProxyUrl = process.env.ICECAST_PROXY_URL ?? (isProduction ? 'https://159.112.140.93.nip.io' : 'http://localhost:8000');
const hlsProxyUrl = process.env.HLS_PROXY_URL ?? (isProduction ? 'https://159.112.140.93.nip.io/hls' : 'http://localhost:8888');

const nextConfig = {
  devIndicators: false,
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyUrl}/:path*`
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiProxyUrl}/socket.io/:path*`
      },
      {
        source: '/radio/:path*',
        destination: `${icecastProxyUrl}/radio/:path*`
      },
      {
        source: '/hls/:path*',
        destination: `${hlsProxyUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
