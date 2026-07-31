import { Share, Platform } from 'react-native';

/** Prototype deep-link style URL for a user profile */
export function profileShareUrl(userId: string) {
  return `https://mawahib.app/u/${userId}`;
}

export async function shareProfile(options: {
  userId: string;
  userName: string;
}) {
  const url = profileShareUrl(options.userId);
  const message = `Check out ${options.userName} on Mawahib`;

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { message, url }
        : { message: `${message}\n${url}`, title: options.userName }
    );
  } catch {
    // User dismissed the sheet — ignore
  }
}
