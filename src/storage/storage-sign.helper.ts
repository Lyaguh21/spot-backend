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
            result.couple.members.map(async (member: any) =>
                member.user
                    ? {
                        ...member,
                        user: await signAvatar(storage, member.user),
                    }
                    : signAvatar(storage, member),
            ),
        );
    }

    return result;
}

export async function signPlacesWithVisitsResponse<
    T extends { map: { visits: any[] }[] },
>(
    storage: StorageService,
    response: T,
): Promise<T> {
    return {
        ...response,
        map: await Promise.all(
            response.map.map(async (place) => ({
                ...place,
                visits: await Promise.all(
                    place.visits.map((visit) =>
                        signVisitResponse(storage, visit),
                    ),
                ),
            })),
        ),
    };
}
