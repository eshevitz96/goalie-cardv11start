"use client";

import { useState, useEffect } from 'react';
import { getUsersForRoleManagement, updateUserRole, ManagedUser } from '@/app/admin/actions';
import { Shield, ShieldAlert, ShieldCheck, UserCheck, UserX, Loader2, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RoleManagementTable() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await getUsersForRoleManagement();
            if (res.success && res.users) {
                setUsers(res.users);
            } else {
                setMessage({ type: 'error', text: res.error || "Failed to fetch users." });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || "Error loading users." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (targetUserId: string, newRole: 'coach' | 'goalie' | 'parent' | 'admin') => {
        setUpdatingId(targetUserId);
        setMessage(null);
        try {
            const res = await updateUserRole({ targetUserId, newRole });
            if (res.success) {
                setMessage({ type: 'success', text: `Role updated to ${newRole.toUpperCase()} successfully.` });
                setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
            } else {
                setMessage({ type: 'error', text: res.error || "Failed to update role." });
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err?.message || "Failed to update role." });
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return u.email.toLowerCase().includes(query) ||
               u.fullName.toLowerCase().includes(query) ||
               u.goalieName.toLowerCase().includes(query) ||
               u.role.toLowerCase().includes(query);
    });

    const coachCount = users.filter(u => u.role === 'coach').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    return (
        <div className="space-y-6">
            {/* Header & Stats Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="text-[#00E676]" size={20} />
                        <h2 className="text-lg font-black text-white tracking-tight">Coach & User Access Control</h2>
                    </div>
                    <p className="text-xs text-zinc-400">
                        Admin-only control room. Grant or revoke coach privileges across all platform accounts.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2 text-center">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Active Coaches</span>
                        <span className="text-lg font-black text-[#00E676]">{coachCount}</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2 text-center">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Platform Admins</span>
                        <span className="text-lg font-black text-amber-400">{adminCount}</span>
                    </div>
                </div>
            </div>

            {/* Notification alert */}
            {message && (
                <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                    {message.text}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00E676] transition-colors"
                />
            </div>

            {/* Users Table */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-[#00E676]" size={28} />
                        <span className="text-xs text-zinc-500">Loading user records...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-sm">
                        No users found matching your search.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                                    <th className="py-3.5 px-4">User</th>
                                    <th className="py-3.5 px-4">Current Role</th>
                                    <th className="py-3.5 px-4">Assigned Goalies</th>
                                    <th className="py-3.5 px-4 text-right">Access Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50 text-sm">
                                {filteredUsers.map(user => {
                                    const isCoach = user.role === 'coach';
                                    const isAdmin = user.role === 'admin';
                                    const isParent = user.role === 'parent';
                                    const isGoalie = user.role === 'goalie' || (!isCoach && !isAdmin && !isParent);
                                    const isSelfAdmin = user.email === 'eshevitz96@gmail.com';

                                    return (
                                        <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {user.fullName || "User"}
                                                    {isAdmin && (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-zinc-400 mt-0.5">{user.email}</div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    isCoach ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' :
                                                    isParent ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-zinc-800 text-zinc-300'
                                                }`}>
                                                    {user.role?.toUpperCase() || 'GOALIE'}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4">
                                                {isCoach || isAdmin ? (
                                                    <span className="text-xs text-zinc-300 font-medium">
                                                        {isAdmin ? 'All Goalies (Global)' : `${user.assignedGoaliesCount || 0} Goalies`}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-zinc-500">—</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-right">
                                                {isSelfAdmin ? (
                                                    <span className="text-xs text-zinc-500 italic">Protected Superadmin</span>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isCoach ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleRoleChange(user.id, 'goalie')}
                                                                disabled={updatingId === user.id}
                                                                className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                            >
                                                                {updatingId === user.id ? <Loader2 className="animate-spin" size={12} /> : <UserX size={12} className="mr-1" />}
                                                                Revoke Coach Access
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleRoleChange(user.id, 'coach')}
                                                                disabled={updatingId === user.id}
                                                                className="text-xs bg-[#00E676] text-black font-bold hover:bg-[#00c864]"
                                                            >
                                                                {updatingId === user.id ? <Loader2 className="animate-spin" size={12} /> : <ShieldCheck size={12} className="mr-1" />}
                                                                Grant Coach Role
                                                            </Button>
                                                        )}

                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                            disabled={updatingId === user.id}
                                                            className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#00E676]"
                                                        >
                                                            <option value="goalie">Goalie</option>
                                                            <option value="parent">Parent</option>
                                                            <option value="coach">Coach</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
