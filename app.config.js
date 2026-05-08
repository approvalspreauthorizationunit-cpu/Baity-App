export default {
  expo: {
    name: 'بيتي',
    slug: 'baiti',
    owner: 'mostafa1593s-organization',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    updates: {
      url: 'https://u.expo.dev/85c2594f-b539-42d4-900f-835a7d14ec4b'
    },
    runtimeVersion: {
      policy: 'appVersion'
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.beiti'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: '85c2594f-b539-42d4-900f-835a7d14ec4b'
      }
    }
  }
}