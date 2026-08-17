import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, EyeOff, Upload, Download, Loader2 } from 'lucide-react';
import Modal from '../components/Modal.tsx';
import { loadUsers } from '../data/sampleData';
import {
    bulkCreateUsers,
    createUser,
    deleteUser,
    downloadUserImportTemplate,
    fetchDepartments,
    updateUser,
} from '../services/AdminApi.ts';
import type { BulkUserImportResult } from '../types/admin.ts';
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
    const [showPassword, setShowPassword] = useState(false);
    const [importModal, setImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [importResult, setImportResult] = useState<BulkUserImportResult | null>(null);

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
        setShowPassword(false);
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
        setShowPassword(false);
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
        setShowPassword(false);
    };

    const handleDeleteUser = (user: any) => {
        setDeleteError('');
        setDeletingUser(user);
    };

    const handleOpenImport = () => {
        setImportFile(null);
        setImportError('');
        setImportResult(null);
        setImportModal(true);
    };

    const handleImportUsers = async () => {
        if (!importFile) {
            setImportError('Please choose a CSV or Excel file to import.');
            return;
        }

        setImportLoading(true);
        setImportError('');
        setImportResult(null);

        try {
            const result = await bulkCreateUsers(importFile);
            setImportResult(result);

            if (result.created > 0) {
                const updatedUsers = await loadUsers();
                setUsers(updatedUsers);
            }
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Failed to import users');
        } finally {
            setImportLoading(false);
        }
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
                            <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={handleOpenImport}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            >
                                <Upload size={14} />
                                Import Users
                            </button>
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
            <Modal
                open={addUserModal}
                onClose={() => {
                    setAddUserModal(false);
                    setShowPassword(false);
                }}
                title={editingUser ? 'Edit User' : 'Add New User'}
                size="md"
            >
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
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Password
                            {editingUser && (
                                <span className="font-normal text-slate-400"> (optional)</span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                autoComplete="new-password"
                                placeholder={
                                    editingUser
                                        ? 'Leave blank to keep current password'
                                        : 'Enter password (min. 6 characters)'
                                }
                                className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
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
                open={importModal}
                onClose={() => !importLoading && setImportModal(false)}
                title="Import Users"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Upload a CSV or Excel file with one user per row. Required columns:
                        <span className="font-medium text-slate-800"> firstName, lastName, email, password, department, role</span>.
                        Department names must match existing departments exactly.
                    </p>

                    <button
                        type="button"
                        onClick={downloadUserImportTemplate}
                        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                        <Download size={15} />
                        Download template (.csv)
                    </button>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Spreadsheet file
                        </label>
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => {
                                setImportFile(e.target.files?.[0] ?? null);
                                setImportError('');
                                setImportResult(null);
                            }}
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                        {importFile && (
                            <p className="mt-1.5 text-xs text-slate-500">{importFile.name}</p>
                        )}
                    </div>

                    {importError && (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {importError}
                        </div>
                    )}

                    {importResult && (
                        <div className="space-y-3">
                            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                                Successfully created {importResult.created} user{importResult.created === 1 ? '' : 's'}.
                            </div>

                            {importResult.failed.length > 0 && (
                                <div className="border border-amber-200 rounded-lg overflow-hidden">
                                    <div className="px-3 py-2 bg-amber-50 text-amber-900 text-sm font-medium">
                                        {importResult.failed.length} row{importResult.failed.length === 1 ? '' : 's'} failed
                                    </div>
                                    <div className="max-h-40 overflow-y-auto divide-y divide-amber-100">
                                        {importResult.failed.map((failure) => (
                                            <div key={`${failure.row}-${failure.email ?? 'unknown'}`} className="px-3 py-2 text-xs text-slate-700">
                                                <span className="font-medium">Row {failure.row}</span>
                                                {failure.email ? ` (${failure.email})` : ''}: {failure.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleImportUsers}
                            disabled={importLoading || !importFile}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
                        >
                            {importLoading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Loader2 size={15} className="animate-spin" />
                                    Importing...
                                </span>
                            ) : (
                                'Import Users'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setImportModal(false)}
                            disabled={importLoading}
                            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                        >
                            {importResult ? 'Close' : 'Cancel'}
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