export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
    return [{ id: 'demo' }];
}

export default function LogSessionPage() {
    return <div className="p-4 text-white">Log session placeholder</div>;
}
