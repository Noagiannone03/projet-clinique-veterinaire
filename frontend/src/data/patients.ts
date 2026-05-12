import type { Patient, Owner } from '../types';

const owners: Owner[] = [
    {
        id: 'own-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@email.fr',
        phone: '06 12 34 56 78',
        address: '12 Rue des Lilas, 01330 Villars-les-Dombes',
    },
    {
        id: 'own-2',
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@email.fr',
        phone: '06 98 76 54 32',
        address: '45 Avenue du Parc, 01330 Villars-les-Dombes',
    },
    {
        id: 'own-3',
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'pierre.bernard@email.fr',
        phone: '06 55 44 33 22',
        address: '8 Place de la Mairie, 01330 Villars-les-Dombes',
    },
    {
        id: 'own-4',
        firstName: 'Sophie',
        lastName: 'Petit',
        email: 'sophie.petit@email.fr',
        phone: '06 11 22 33 44',
        address: '23 Chemin des Etangs, 01330 Villars-les-Dombes',
    },
];

export const patients: Patient[] = [
    {
        id: 'pat-1',
        name: 'Max',
        species: 'dog',
        breed: 'Golden Retriever',
        birthDate: '2020-03-15',
        weight: 32,
        color: 'Dore',
        microchip: '250269812345678',
        owner: owners[0],
        alerts: [
            {
                id: 'alt-1',
                type: 'behavioral',
                severity: 'medium',
                description: 'Anxieux chez le veterinaire - Besoin de patience',
            },
        ],
        vaccinations: [
            {
                id: 'vac-1',
                name: 'Rage',
                date: '2025-06-15',
                nextDueDate: '2026-06-15',
                veterinarian: 'Dr. Martin',
            },
            {
                id: 'vac-2',
                name: 'CHPLR',
                date: '2025-03-10',
                nextDueDate: '2026-03-10',
                veterinarian: 'Dr. Martin',
            },
        ],
        medicalHistory: [
            {
                id: 'med-1',
                date: '2025-12-10',
                type: 'consultation',
                diagnosis: 'Otite externe',
                treatment: 'Nettoyage auriculaire + traitement antibiotique',
                notes: 'Amelioration attendue sous 7 jours',
                veterinarian: 'Dr. Martin',
                prescriptions: [
                    {
                        id: 'presc-1',
                        medication: 'Easotic',
                        dosage: '1ml',
                        frequency: '1 fois par jour',
                        duration: '7 jours',
                        instructions: 'Appliquer dans chaque oreille apres nettoyage',
                    },
                ],
            },
        ],
    },
    {
        id: 'pat-2',
        name: 'Minou',
        species: 'cat',
        breed: 'Europeen',
        birthDate: '2019-07-22',
        weight: 4.5,
        color: 'Tigre gris',
        microchip: '250269887654321',
        owner: owners[1],
        alerts: [],
        vaccinations: [
            {
                id: 'vac-3',
                name: 'Typhus-Coryza',
                date: '2025-07-01',
                nextDueDate: '2026-07-01',
                veterinarian: 'Dr. Leroy',
            },
        ],
        medicalHistory: [
            {
                id: 'med-2',
                date: '2025-11-05',
                type: 'surgery',
                diagnosis: 'Sterilisation',
                treatment: 'Ovariectomie',
                notes: 'Intervention sans complication',
                veterinarian: 'Dr. Leroy',
                prescriptions: [
                    {
                        id: 'presc-2',
                        medication: 'Metacam',
                        dosage: '0.5ml',
                        frequency: '1 fois par jour',
                        duration: '3 jours',
                        instructions: 'Donner avec la nourriture',
                    },
                ],
            },
        ],
    },
    {
        id: 'pat-3',
        name: 'Rocky',
        species: 'dog',
        breed: 'Berger Allemand',
        birthDate: '2018-11-03',
        weight: 38,
        color: 'Noir et feu',
        microchip: '250269811122334',
        owner: owners[2],
        alerts: [
            {
                id: 'alt-2',
                type: 'behavioral',
                severity: 'high',
                description: 'ATTENTION - Peut mordre - Utiliser museliere',
            },
            {
                id: 'alt-3',
                type: 'medical',
                severity: 'medium',
                description: 'Dysplasie de la hanche - Eviter sauts',
            },
        ],
        vaccinations: [
            {
                id: 'vac-4',
                name: 'Rage',
                date: '2025-04-20',
                nextDueDate: '2026-04-20',
                veterinarian: 'Dr. Martin',
            },
        ],
        medicalHistory: [
            {
                id: 'med-3',
                date: '2026-01-05',
                type: 'follow-up',
                diagnosis: 'Suivi dysplasie',
                treatment: 'Anti-inflammatoires + glucosamine',
                notes: 'Etat stable, continuer le traitement',
                veterinarian: 'Dr. Martin',
                prescriptions: [
                    {
                        id: 'presc-3',
                        medication: 'Previcox',
                        dosage: '1 comprime 227mg',
                        frequency: '1 fois par jour',
                        duration: '30 jours',
                        instructions: 'Donner avec le repas',
                    },
                ],
            },
        ],
    },
    {
        id: 'pat-4',
        name: 'Coco',
        species: 'bird',
        breed: 'Perroquet Gris du Gabon',
        birthDate: '2015-05-10',
        weight: 0.45,
        color: 'Gris',
        owner: owners[3],
        alerts: [],
        vaccinations: [],
        medicalHistory: [
            {
                id: 'med-4',
                date: '2025-10-15',
                type: 'consultation',
                diagnosis: 'Picage',
                treatment: 'Enrichissement environnemental + complement alimentaire',
                notes: 'Stress lie au demenagement du proprietaire',
                veterinarian: 'Dr. Leroy',
                prescriptions: [],
            },
        ],
    },
    {
        id: 'pat-5',
        name: 'Luna',
        species: 'cat',
        breed: 'Maine Coon',
        birthDate: '2021-02-14',
        weight: 6.2,
        color: 'Silver tabby',
        microchip: '250269899887766',
        owner: owners[0],
        alerts: [
            {
                id: 'alt-4',
                type: 'allergy',
                severity: 'high',
                description: 'Allergie aux AINS - NE PAS ADMINISTRER',
            },
        ],
        vaccinations: [
            {
                id: 'vac-5',
                name: 'Typhus-Coryza-Leucose',
                date: '2025-08-20',
                nextDueDate: '2026-08-20',
                veterinarian: 'Dr. Martin',
            },
        ],
        medicalHistory: [],
    },
    {
        id: 'pat-6',
        name: 'Noisette',
        species: 'rabbit',
        breed: 'Nain Belier',
        birthDate: '2022-04-01',
        weight: 1.8,
        color: 'Beige',
        owner: owners[1],
        alerts: [],
        vaccinations: [
            {
                id: 'vac-6',
                name: 'Myxomatose-VHD',
                date: '2025-09-10',
                nextDueDate: '2026-09-10',
                veterinarian: 'Dr. Leroy',
            },
        ],
        medicalHistory: [],
    },
];

export const getPatientById = (id: string): Patient | undefined => {
    return patients.find((p) => p.id === id);
};

export const searchPatients = (query: string): Patient[] => {
    const lowerQuery = query.toLowerCase();
    return patients.filter(
        (p) =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.owner.lastName.toLowerCase().includes(lowerQuery) ||
            p.breed.toLowerCase().includes(lowerQuery)
    );
};
