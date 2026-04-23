import { redirect } from 'next/navigation';

export default async function SubmitReportRedirect({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    redirect(`/trails/${id}/report`);
}
