export class NetworkError extends Error {
  constructor(message = 'Network error. Please check your connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}
