import type { IUserMetadataRepository } from '../../repositories/IUserMetadataRepository';

export class UpdateProfile {
  constructor(private readonly metadataRepository: IUserMetadataRepository) {}

  /** Update the user's display name. */
  async execute(uid: string, displayName: string): Promise<void> {
    if (!displayName || displayName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
    if (displayName.trim().length > 50) {
      throw new Error('Display name must be at most 50 characters');
    }
    return this.metadataRepository.updateDisplayName(uid, displayName.trim());
  }
}
