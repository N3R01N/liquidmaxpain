/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    trailingSlash: true,
    output: 'export',
    images: { unoptimized: true },
    webpack: (config , { isServer })=> {
      config.resolve.fallback = { fs: false, net: false, tls: false };
      config.externals.push("pino-pretty", "lokijs", "encoding");
      if(!isServer){
         // Ignore the React Native module in browser builds
        config.resolve.fallback = {
          ...config.resolve.fallback,
          '@react-native-async-storage/async-storage': false,
      }
      }
      return config;
    },
    transpilePackages: ['@metamask/sdk'],
  };
  
  export default nextConfig;