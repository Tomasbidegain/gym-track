export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

export function isValidUserProfile(user: Partial<UserProfile>): user is UserProfile {
  return (
    typeof user.uid === 'string' &&
    user.uid.length > 0 &&
    typeof user.email === 'string' &&
    user.email.length > 0 &&
    user.createdAt instanceof Date &&
    !isNaN(user.createdAt.getTime())
  );
}
