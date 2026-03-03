import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goalieguard.app',
  appName: 'Goalie Card',
  webDir: 'public',
  server: {
    url: 'https://goalie-cardv11start.vercel.app',
  }
};

export default config;
