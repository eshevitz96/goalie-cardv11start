import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goalieguard.app',
  appName: 'GoalieGuard',
  webDir: 'public',
  server: {
    url: 'http://192.168.1.181:3000', // Automatically updated to your local IP
    cleartext: true
  }
};

export default config;
