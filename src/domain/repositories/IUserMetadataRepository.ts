export interface IUserMetadataRepository {
  /** Get the seed status for a user. Returns null seededAt if not yet seeded. */
  getSeedStatus(uid: string): Promise<{ seededAt: Date | null }>;

  /** Mark the user's exercise collection as seeded with the current timestamp. */
  markAsSeeded(uid: string): Promise<void>;

  /** Update the user's display name in the metadata document. */
  updateDisplayName(uid: string, displayName: string): Promise<void>;

  /** Get the user's display name from the metadata document. Returns null if not set. */
  getDisplayName(uid: string): Promise<string | null>;
}
