export class AuthError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('Invalid email or password', 'auth/invalid-credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailInUseError extends AuthError {
  constructor() {
    super('Email is already in use', 'auth/email-in-use');
    this.name = 'EmailInUseError';
  }
}

export class WeakPasswordError extends AuthError {
  constructor() {
    super('Password is too weak (minimum 6 characters)', 'auth/weak-password');
    this.name = 'WeakPasswordError';
  }
}

export class UserNotFoundError extends AuthError {
  constructor() {
    super('No user found with this email', 'auth/user-not-found');
    this.name = 'UserNotFoundError';
  }
}

export class TooManyRequestsError extends AuthError {
  constructor() {
    super('Too many attempts. Please try again later', 'auth/too-many-requests');
    this.name = 'TooManyRequestsError';
  }
}

export function mapFirebaseAuthError(code: string): AuthError {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-disabled':
      return new InvalidCredentialsError();
    case 'auth/email-already-in-use':
    case 'auth/account-exists-with-different-credential':
      return new EmailInUseError();
    case 'auth/weak-password':
      return new WeakPasswordError();
    case 'auth/user-not-found':
      return new UserNotFoundError();
    case 'auth/too-many-requests':
      return new TooManyRequestsError();
    default:
      return new AuthError(`Authentication failed: ${code}`, code);
  }
}
