import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2 } from 'lucide-react';
import Modal from '../components/Modal.tsx';
import { loadUsers } from '../data/sampleData';
import { createUser, updateUser } from '../services/AdminApi.ts';

type AdminTab = 'users';

const departments = [
    {
        "id": "3b824989-8cd8-4f2d-bd7f-693c5358c752",
        "name": "Human Resources"
    },
    {
        "id": "23be27d6-8a45-4822-ba84-19f3bcc64432",
        "name": "Finance"
    }
];

export default function Administration() {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [addUserModal, setAddUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        loadUsers()
            .then(setUsers)
            .catch(error => {
                console.error('Failed to load users', error);
            });
    }, []);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        departmentId: departments[0].id,
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
            departmentId:departments[0].id,
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
                            ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
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
                                    className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 w-64"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddUser}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
                            >
                                <Plus size={14} />
                                Add User
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['User', 'Email', 'Department', 'Role'].map(col => (
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
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.loginRole === 'ADMINISTRATOR' ? 'Administrator' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => handleEditUser(user)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="Edit">
                                                        <Edit2 size={12} />
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
                                } placeholder="First name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Last Name</label>
                            <input type="text" value={form.lastName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        lastName: e.target.value,
                                    })
                                } placeholder="Last name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
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
                            } placeholder="user@company.com" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                        <input type="password" value={form.password}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    password: e.target.value,
                                })
                            } placeholder="password123" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
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
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
                        >
                            {editingUser ? "Update User" : "Create User"}
                        </button>
                        <button type="button" onClick={() => setAddUserModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}