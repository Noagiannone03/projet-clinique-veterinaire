import type { Patient } from '../types';

const patientPhotoPool: Record<Patient['species'], string[]> = {
    cat: [
        'https://upload.wikimedia.org/wikipedia/commons/9/9e/Domestic_cat.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/9/9b/Domestic_cat_cropped.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/1/11/Domestic_cat-.jpg',
    ],
    dog: [
        'https://upload.wikimedia.org/wikipedia/commons/f/fe/Dog_dog.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/5/55/Domestic_Dog.jpg',
    ],
    bird: [
        'https://upload.wikimedia.org/wikipedia/commons/6/61/Budgerigar.JPG',
    ],
    rabbit: [
        'https://upload.wikimedia.org/wikipedia/commons/0/08/A_rabbit.jpg',
    ],
    other: [
        'https://upload.wikimedia.org/wikipedia/commons/9/9e/Domestic_cat.jpg',
    ],
};

function hashPatientId(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function getPatientPhotoUrl(species: Patient['species'], patientId: string): string {
    const photos = patientPhotoPool[species];
    const idx = hashPatientId(patientId) % photos.length;
    return photos[idx];
}

export function getFallbackPatientPhotoUrl(species: Patient['species']): string {
    return patientPhotoPool[species][0];
}
