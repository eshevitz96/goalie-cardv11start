
import { MessageSquare, Calendar, User, Smile, Frown, Meh } from 'lucide-react';

export function FeedbackTable({ feedback, isLoading }: { feedback: any[], isLoading: boolean }) {

    const getMoodIcon = (mood: string) => {
        switch (mood) {
            case 'happy': return <Smile className="text-green-500" size={18} />;
            case 'frustrated': return <Frown className="text-red-500" size={18} />;
            case 'neutral': return <Meh className="text-yellow-500" size={18} />;
            default: return <Smile className="text-gray-400" size={18} />;
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading feedback...</div>;
    }

    if (!feedback || feedback.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <MessageSquare className="text-primary" size={32} />
                </div>
                <h3 className="text-lg font-bold">No Feedback Yet</h3>
                <p className="text-muted-foreground">Beta feedback submitted by users will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="font-bold flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" />
                    Beta Feedback ({feedback.length})
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3 text-center">Mood</th>
                            <th className="px-6 py-3">Feedback</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {feedback.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-[10px] pl-6 opacity-70">
                                        {new Date(item.created_at).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-foreground">
                                        {item.roster?.goalie_name || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {item.roster?.email || 'No email'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full bg-secondary text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        {item.author_role || 'User'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        {getMoodIcon(item.mood)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-md">
                                    <div className="text-foreground text-sm leading-relaxed p-3 bg-secondary/30 rounded-lg">
                                        "{item.content}"
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
