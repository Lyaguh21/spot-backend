import { OwnerType } from '@prisma/client';

type VisitWithPlace = {
    ownerType: OwnerType;
    coupleId?: string | null;
    description?: string | null;
    ratings: unknown;
    isFavorite: boolean;
    photoURL: string;
    icon: string;
    color: string;
    visitDate: Date;
    place: {
        externalId?: string | null;
        title: string;
        lat: number;
        lng: number;
        address?: string | null;
        websiteUrl?: string | null;
    };
};

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

export function toVisitResponse(visit: VisitWithPlace) {
    return {
        ownerType: visit.ownerType,
        ...(visit.ownerType === OwnerType.COUPLE && visit.coupleId
            ? { coupleId: visit.coupleId }
            : {}),
        ...(visit.place.externalId ? { externalId: visit.place.externalId } : {}),
        title: visit.place.title,
        lat: visit.place.lat,
        lng: visit.place.lng,
        ...(visit.place.address ? { address: visit.place.address } : {}),
        ...(visit.place.websiteUrl ? { websiteUrl: visit.place.websiteUrl } : {}),
        ...(visit.description ? { description: visit.description } : {}),
        ratings: formatRatings(visit.ratings),
        isFavorite: visit.isFavorite,
        photoURL: visit.photoURL,
        icon: visit.icon,
        color: visit.color,
        visitDate: visit.visitDate.toISOString(),
    };
}
