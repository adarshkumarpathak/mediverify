import { useState, useEffect } from 'react';
import { useStore } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/Skeleton';
import { Plus, Search, ShieldOff, Trash2, ShieldCheck, X, Users as UsersIcon } from 'lucide-react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../api/adminApi';
import { toast } from 'react-toastify';
import { User } from '../../types/user.types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Users() {
    const { token } = useStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'doctor' });

    const loadUsers = async () => {
        if (!token) return;
        setLoading(true);
        const response = await fetchUsers(token);
        if (response.success) setUsers(response.data);
        setLoading(false);
    };

    useEffect(() => { loadUsers(); }, [token]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        const response = await createUser(token, newUser);
        if (response.success) {
            toast.success('Doctor account created successfully');
            setShowModal(false);
            setNewUser({ name: '', email: '', role: 'doctor' });
            loadUsers();
        } else {
            toast.error(response.message || 'Failed to create user');
        }
    };

    const handleToggleStatus = async (user: User) => {
        if (!token) return;
        const response = await updateUser(token, user.id, { is_active: !user.is_active });
        if (response.success) {
            toast.success(`User ${!user.is_active ? 'enabled' : 'disabled'}`);
            loadUsers();
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!token || !window.confirm('Delete this user?')) return;
        const response = await deleteUser(token, userId);
        if (response.success) { toast.success('User deleted'); loadUsers(); }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <UsersIcon className="text-primary" size={36} />
                        User <span className="text-gradient">Management</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Manage doctor access and system administrators.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground px-5 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20"
                >
                    <Plus size={18} /> Add Doctor
                </motion.button>
            </div>

            <div className="glass-panel rounded-[1.5rem] overflow-hidden shadow-xl shadow-primary/5">
                <div className="p-4 border-b border-border bg-muted/30 flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search users…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <TableSkeleton rows={6} cols={5} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Name / Email', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                                        <th key={h} className={`p-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredUsers.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="hover:bg-muted/30 transition-colors group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                    {(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{u.name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${u.is_active !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${u.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                {u.is_active !== false ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {u.role !== 'admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleStatus(u)}
                                                            className={`p-2 rounded-xl hover:bg-muted transition-colors ${u.is_active !== false ? 'text-violet-500' : 'text-emerald-500'}`}
                                                            title={u.is_active !== false ? 'Disable' : 'Enable'}
                                                        >
                                                            {u.is_active !== false ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredUsers.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16 text-muted-foreground">
                                            <UsersIcon size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="font-bold">No users found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-foreground/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="glass-panel rounded-[2rem] shadow-2xl w-full max-w-md p-1"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-foreground">Add New Doctor</h2>
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateUser} className="space-y-5">
                                    {[
                                        { label: 'Full Name', field: 'name', type: 'text' },
                                        { label: 'Email Address', field: 'email', type: 'email' },
                                    ].map(({ label, field, type }) => (
                                        <div key={field} className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                                            <input
                                                type={type} required
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                                                value={(newUser as any)[field]}
                                                onChange={e => setNewUser({ ...newUser, [field]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)}
                                            className="flex-1 px-4 py-3 border border-border rounded-xl font-bold text-foreground hover:bg-muted transition-all">
                                            Cancel
                                        </button>
                                        <button type="submit"
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">
                                            Create Account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
