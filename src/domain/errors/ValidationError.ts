export class ValidationError extends Error {
  public readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    const message = Object.entries(fields)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('; ');
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}
