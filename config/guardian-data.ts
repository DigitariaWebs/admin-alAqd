export interface GuardianRelationship {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    guardianName: string; // "Nom du tuteur"
    guardianEmail: string; // "Email ou Téléphone"
    status: 'Actif' | 'En attente' | 'Révoqué' | 'Refusé';
    accessCode: string; // e.g., "7823"
    requestedAt: string; // ISO Date
    linkedAt?: string; // ISO Date
}

export const MOCK_GUARDIAN_RELATIONSHIPS: GuardianRelationship[] = [
    {
        id: 'rel_1',
        userId: 'u_1',
        userName: 'Sarah Wilson',
        userEmail: 'sarah@example.com',
        guardianName: 'Omar Wilson',
        guardianEmail: 'omar.w@example.com',
        status: 'Actif',
        accessCode: '7823',
        requestedAt: '2023-11-20T10:00:00Z',
        linkedAt: '2023-11-20T12:30:00Z'
    },
    {
        id: 'rel_2',
        userId: 'u_4',
        userName: 'Maria Garcia',
        userEmail: 'maria@example.com',
        guardianName: 'Karim Garcia',
        guardianEmail: '+33612345678',
        status: 'En attente',
        accessCode: '9021',
        requestedAt: '2024-02-12T09:15:00Z'
    },
    {
        id: 'rel_3',
        userId: 'u_2',
        userName: 'Amina Benali',
        userEmail: 'amina@example.com',
        guardianName: 'Ahmed Benali',
        guardianEmail: 'ahmed.b@example.com',
        status: 'Révoqué',
        accessCode: '1122',
        requestedAt: '2024-01-05T14:20:00Z',
        linkedAt: '2024-01-06T09:00:00Z'
    },
    {
        id: 'rel_4',
        userId: 'u_5',
        userName: 'Fatima Zohra',
        userEmail: 'fatima@example.com',
        guardianName: 'Papa',
        guardianEmail: '', // Invited via code sharing only
        status: 'En attente',
        accessCode: '4455',
        requestedAt: '2024-03-01T16:45:00Z'
    }
];
