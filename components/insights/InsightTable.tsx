import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface InsightTableProps {
    title: string;
    icon?: React.ReactNode;
    headers: string[];
    children: React.ReactNode;
}

export function InsightTable({ title, icon, headers, children }: InsightTableProps) {
    return (
        <Card className="glass border-border/50">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {icon} {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0 backdrop-blur-md">
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i} className={`px-4 py-3 ${i === 0 ? 'rounded-tl-lg' : ''} ${i === headers.length - 1 ? 'rounded-tr-lg' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {children}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
