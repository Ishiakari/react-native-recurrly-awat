import Constants from 'expo-constants'
import PostHog from 'posthog-react-native'

const extra = Constants.expoConfig?.extra
const projectToken = extra?.posthogProjectToken as string | undefined
const host = extra?.posthogHost as string | undefined

if (!projectToken && __DEV__) {
  throw new Error(
    'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured',
  )
}

export const posthog = projectToken
  ? new PostHog(projectToken, host ? { host } : undefined)
  : undefined
