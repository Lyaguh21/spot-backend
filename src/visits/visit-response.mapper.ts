import { OwnerType } from '@prisma/client';

type VisitWithPlace = {
    placeId?: string;
    ownerType: OwnerType;
    coupleId?: string | null;
    title: string;
    description?: string | null;
    ratings: unknown;
    isFavorite: boolean;
    photoURL: string;
    icon: string;
    color: string;
    visitDate: Date;
    place: {
        id?: string;
        externalId?: string | null;
        title: string;
        lat: number;
        lng: number;
        address?: string | null;
        websiteUrl?: string | null;
    };
};

function toPlaceResponse(place: VisitWithPlace['place']) {
    return {
        ...(place.externalId ? { externalId: place.externalId } : {}),
        title: place.title,
        lat: place.lat,
        lng: place.lng,
        ...(place.address ? { address: place.address } : {}),
        ...(place.websiteUrl ? { websiteUrl: place.websiteUrl } : {}),
    };
}

function formatRatings(ratings: unknown) {
    if (!Array.isArray(ratings)) {
        return [];
    }

    return ratings.map((item) => {
        const ratingItem = item as {
            nickname?: unknown;
            rating?: unknown;
        };

        return {
            nickname: String(ratingItem.nickname ?? ''),
            rating: Number(ratingItem.rating),
        };
    });
}

function toVisitOnlyResponse(visit: VisitWithPlace) {
    return {
        ownerType: visit.ownerType,
        ...(visit.ownerType === OwnerType.COUPLE && visit.coupleId
            ? { coupleId: visit.coupleId }
            : {}),
        title: visit.title,
        description: visit.description ?? '',
        ratings: formatRatings(visit.ratings),
        isFavorite: visit.isFavorite,
        photoURL: visit.photoURL,
        icon: visit.icon,
        color: visit.color,
        visitDate: visit.visitDate.toISOString(),
    };
}

export function toVisitResponse(visit: VisitWithPlace) {
    return {
        ...toPlaceResponse(visit.place),
        ...toVisitOnlyResponse(visit),
    };
}

export function toPlacesWithVisitsResponse(visits: VisitWithPlace[]) {
    const placesMap = new Map<
        string,
        {
            place: ReturnType<typeof toPlaceResponse>;
            visits: ReturnType<typeof toVisitOnlyResponse>[];
        }
    >();

    for (const visit of visits) {
        const placeKey =
            visit.place.id ?? visit.placeId ?? `${visit.place.lat}:${visit.place.lng}:${visit.place.title}`;

        if (!placesMap.has(placeKey)) {
            placesMap.set(placeKey, {
                place: toPlaceResponse(visit.place),
                visits: [],
            });
        }

        placesMap.get(placeKey)!.visits.push(toVisitOnlyResponse(visit));
    }

    return {
        map: Array.from(placesMap.values()),
    };
}
