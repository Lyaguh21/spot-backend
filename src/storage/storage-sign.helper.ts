import { StorageService } from './storage.service';

export async function signPhotos<T extends { photos: string[] }>(
    storage: StorageService,
    entity: T,
): Promise<T> {
    return {
        ...entity,
        photos: await storage.signUrls(entity.photos ?? []),
    };
}

export async function signAvatar<T extends { avatarUrl?: string | null }>(
    storage: StorageService,
    entity: T,
): Promise<T> {
    return {
        ...entity,
        avatarUrl: await storage.signUrl(entity.avatarUrl),
    };
}

export async function signVisitResponse(
    storage: StorageService,
    visit: any,
) {
    const result = await signPhotos(storage, visit);

    if (result.user) {
        result.user = await signAvatar(storage, result.user);
    }

    if (result.couple?.members?.length) {
        result.couple.members = await Promise.all(
            result.couple.members.map(async (member: any) => ({
                ...member,
                user: await signAvatar(storage, member.user),
            })),
        );
    }

    return result;
}