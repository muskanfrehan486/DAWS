import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal.tsx';
import { loadUsers } from '../data/sampleData';
import { createUser, deleteUser, fetchDepartments, updateUser } from '../services/AdminApi.ts';
import type { Department } from '../services/AdminApi.ts';

type AdminTab = 'users';

export default function Administration() {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [addUserModal, setAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deletingUser, setDeletingUser] = useState<any | null>(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        loadUsers()
            .then(setUsers)
            .catch(error => {
                console.error('Failed to load users', error);
            });

        fetchDepartments()
            .then(setDepartments)
            .catch(error => {
                console.error('Failed to load departments', error);
            });
    }, []);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        departmentId: "",
        role: "USER",
    });

    const filteredUsers = users.filter((u: any) =>
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.department.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddUser = () => {
        console.log("Before opening modal:", search);
        setEditingUser(null);
        setForm({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            departmentId: departments[0]?.id ?? "",
            role: "USER",
        });
        setAddUserModal(true);
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: "",
            departmentId: user.department.id,
            role: user.loginRole,
        });
        setAddUserModal(true);
    };

    const handleSaveUser = async () => {
        if (editingUser) {
            await updateUser(editingUser.id, {
                email: form.email,
                firstName: form.firstName,
                lastName: form.lastName,
                departmentId: form.departmentId,
                loginRole: form.role,
                ...(form.password ? { password: form.password } : {}),
            });

        } else {
            await createUser({
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                departmentId: form.departmentId,
                loginRole: form.role,
            });
        }

        const updatedUsers = await loadUsers();
        setUsers(updatedUsers);
        setAddUserModal(false);
        setEditingUser(null);
    };

    const handleDeleteUser = (user: any) => {
        setDeleteError('');
        setDeletingUser(user);
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser) return;

        setDeleteLoading(true);
        setDeleteError('');

        try {
            await deleteUser(deletingUser.id);
            const updatedUsers = await loadUsers();
            setUsers(updatedUsers);
            setDeletingUser(null);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setDeleteLoading(false);
        }
    };
    useEffect(() => {
        console.log("search state:", search);
    }, [search]);
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Administration</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage users</p>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-xl overflow-hidden">
                {([
                    { id: 'users', label: 'User Management', icon: Users },
                ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                        type="button"
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === id
                            ? 'border-b-2 border-emerald-600 text-emerald-600 bg-emerald-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                            <div className="relative" >
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    autoComplete="off"
                                    name="user-search"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setSearch(searchInput);
                                        }
                                    }}
                                    placeholder="Search users..."
                                    className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50 w-64"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddUser}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
                            >
                                <Plus size={14} />
                                Add User
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['User', 'Email', 'Department', 'Role', 'Actions'].map(col => (
                                            <th key={col} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user: any) => (
                                        <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-medium`}>
                                                        {user.firstName} {user.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{user.department.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${user.loginRole === 'ADMINISTRATOR'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.loginRole === 'ADMINISTRATOR' ? 'Administrator' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => handleEditUser(user)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors" title="Edit">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteUser(user)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" title="Delete">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            <Modal open={addUserModal} onClose={() => setAddUserModal(false)} title="Add New User" size="md">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div >
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">First Name</label>
                            <input type="text" value={form.firstName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        firstName: e.target.value,
                                    })
                                } placeholder="First name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Last Name</label>
                            <input type="text" value={form.lastName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        lastName: e.target.value,
                                    })
                                } placeholder="Last name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
                        <input type="email" value={form.email}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    email: e.target.value,
                                })
                            } placeholder="user@company.com" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                        <input type="password" value={form.password}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    password: e.target.value,
                                })
                            } placeholder="password123" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Department</label>
                        <select
                            value={form.departmentId}
                            onChange={(e) =>
                                setForm({ ...form, departmentId: e.target.value })
                            }
                        >
                            <option value="">Select a department</option>

                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">System Role</label>
                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    role: e.target.value,
                                })
                            }
                        >
                            <option value="USER">User</option>
                            <option value="ADMINISTRATOR">Administrator</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleSaveUser}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
                        >
                            {editingUser ? "Update User" : "Create User"}
                        </button>
                        <button type="button" onClick={() => setAddUserModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={!!deletingUser}
                onClose={() => !deleteLoading && setDeletingUser(null)}
                title="Delete User"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-slate-900">
                            {deletingUser?.firstName} {deletingUser?.lastName}
                        </span>
                        ? This action cannot be undone.
                    </p>

                    {deleteError && (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {deleteError}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={confirmDeleteUser}
                            disabled={deleteLoading}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                        >
                            {deleteLoading ? 'Deleting...' : 'Delete User'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeletingUser(null)}
                            disabled={deleteLoading}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}