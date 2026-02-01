export const FAITH_TAGS = [
    'prayer', 'fasting', 'zakat', 'hajj', 'umrah',
    'quran', 'tajweed', 'hadith', 'seerah', 'fiqh',
    'taraweeh', 'tahajjud', 'dhikr', 'dua', 'charity',
    'volunteering', 'mosque', 'hijab', 'niqab',
    'beard', 'modesty', 'noMusic', 'noSmoking', 'noAlcohol',
    'familyValues', 'community', 'islamicStudies', 'arabic', 'memorization',
    'sunnah', 'jummah', 'eidCelebration', 'islamicFinance'
];

export const ETHNICITIES = [
    'Amazigh', 'Kabyle', 'Chaoui', 'Riffain', 'Chleuh', 'Mozabite', 'Touareg',
    'Maghrébin', 'Arabe Maghrébin',
    'Africain de l\'Ouest', 'Africain de l\'Est', 'Africain Central',
    'Peul', 'Wolof', 'Soninké', 'Bambara', 'Comorien', 'Sénégalais', 'Malien', 'Ivoirien',
    'Haoussa', 'Somali',
    'Arabe', 'Moyen-Oriental', 'Levantin', 'Khaliji', 'Bédouin',
    'Egyptien', 'Copte',
    'Turc', 'Kurde', 'Persan',
    'Sud-Asiatique', 'Indien', 'Pakistanais', 'Bengali', 'Afghan',
    'Asiatique de l\'Est', 'Indonésien', 'Malais', 'Hui',
    'Européen', 'Blanc', 'Balkans', 'Bosniaque', 'Albanais', 'Tchétchène', 'Russe',
    'Latino', 'Hispanique', 'Américain', 'Caribéen', 'Antillais',
    'Métis', 'Noir', 'Autre'
].sort();

export const COUNTRIES = [
    { code: 'DZ', name: 'Algerian', emoji: '🇩🇿' },
    { code: 'FR', name: 'French', emoji: '🇫🇷' },
    { code: 'MA', name: 'Moroccan', emoji: '🇲🇦' },
    { code: 'TN', name: 'Tunisian', emoji: '🇹🇳' },
    { code: 'US', name: 'American', emoji: '🇺🇸' },
    { code: 'AF', name: 'Afghan', emoji: '🇦🇫' },
    { code: 'AL', name: 'Albanian', emoji: '🇦🇱' },
    { code: 'BE', name: 'Belgian', emoji: '🇧🇪' },
    { code: 'BR', name: 'Brazilian', emoji: '🇧🇷' },
    { code: 'GB', name: 'British', emoji: '🇬🇧' },
    { code: 'CA', name: 'Canadian', emoji: '🇨🇦' },
    { code: 'CN', name: 'Chinese', emoji: '🇨🇳' },
    { code: 'EG', name: 'Egyptian', emoji: '🇪🇬' },
    { code: 'DE', name: 'German', emoji: '🇩🇪' },
    { code: 'IN', name: 'Indian', emoji: '🇮🇳' },
    { code: 'ID', name: 'Indonesian', emoji: '🇮🇩' },
    { code: 'IR', name: 'Iranian', emoji: '🇮🇷' },
    { code: 'IQ', name: 'Iraqi', emoji: '🇮🇶' },
    { code: 'IT', name: 'Italian', emoji: '🇮🇹' },
    { code: 'JO', name: 'Jordanian', emoji: '🇯🇴' },
    { code: 'KW', name: 'Kuwaiti', emoji: '🇰🇼' },
    { code: 'LB', name: 'Lebanese', emoji: '🇱🇧' },
    { code: 'LY', name: 'Libyan', emoji: '🇱🇾' },
    { code: 'MY', name: 'Malaysian', emoji: '🇲🇾' },
    { code: 'MX', name: 'Mexican', emoji: '🇲🇽' },
    { code: 'NL', name: 'Dutch', emoji: '🇳🇱' },
    { code: 'NG', name: 'Nigerian', emoji: '🇳🇬' },
    { code: 'OM', name: 'Omani', emoji: '🇴🇲' },
    { code: 'PK', name: 'Pakistani', emoji: '🇵🇰' },
    { code: 'PS', name: 'Palestinian', emoji: '🇵🇸' },
    { code: 'QA', name: 'Qatari', emoji: '🇶🇦' },
    { code: 'RU', name: 'Russian', emoji: '🇷🇺' },
    { code: 'SA', name: 'Saudi', emoji: '🇸🇦' },
    { code: 'SN', name: 'Senegalese', emoji: '🇸🇳' },
    { code: 'ES', name: 'Spanish', emoji: '🇪🇸' },
    { code: 'SD', name: 'Sudanese', emoji: '🇸🇩' },
    { code: 'SE', name: 'Swedish', emoji: '🇸🇪' },
    { code: 'CH', name: 'Swiss', emoji: '🇨🇭' },
    { code: 'SY', name: 'Syrian', emoji: '🇸🇾' },
    { code: 'TR', name: 'Turkish', emoji: '🇹🇷' },
    { code: 'AE', name: 'Emirati', emoji: '🇦🇪' },
    { code: 'YE', name: 'Yemeni', emoji: '🇾🇪' },
].sort((a, b) => a.name.localeCompare(b.name));

export const EDUCATION_LEVELS = [
    'highSchool',
    'trade',
    'bachelors',
    'masters',
    'doctorate',
    'other',
];

export const MARITAL_STATUSES = [
    'single',
    'divorced',
    'widowed',
    'annulled',
    'separated',
    'married',
];

export const RELIGIOUS_PRACTICES = [
    'practicing',
    'nonPracticing',
    'preferNotToSay',
];
