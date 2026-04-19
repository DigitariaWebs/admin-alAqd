import SuccessClient from './SuccessClient';

interface PageProps {
    searchParams: Promise<{ session_id?: string }>;
}

export default async function SubscribeSuccessPage({ searchParams }: PageProps) {
    const { session_id } = await searchParams;
    return <SuccessClient sessionId={session_id} />;
}
