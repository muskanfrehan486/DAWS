import { useState } from 'react';
import { Users, Mail, Plus, Search, Edit2 } from 'lucide-react';
import { USERS } from '../data/sampleData';
import Modal from '../components/Modal.tsx';
import { EMAIL_TEMPLATES } from '../data/emailTemplate.tsx';

type AdminTab = 'users' | 'email-templates';

const BADGE_STYLES: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    review: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    approval: 'bg-amber-50 text-amber-700 border border-amber-200',
    revision: 'bg-purple-50 text-purple-700 border border-purple-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
};

export default function Administration() {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>(USERS);
    const [addUserModal, setAddUserModal] = useState(false);
    const [templateModal, setTemplateModal] = useState<string | null>(null);

    const [editingUser, setEditingUser] = useState<any | null>(null);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        department: "",
        role: "user",
    });

    const filteredUsers = users.filter((u: any) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.department.toLowerCase().includes(search.toLowerCase())
    );

    const previewTemplate = EMAIL_TEMPLATES.find(t => t.id === templateModal);

    const handleAddUser = () => {
        setEditingUser(null);
        setForm({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            department: "",
            role: "user",
        });
        setAddUserModal(true);
    };
    const handleEditUser = (user: any) => {
        setEditingUser(user);
        const [firstName, ...rest] = user.name.split(" ");
        setForm({
            firstName,
            lastName: rest.join(" "),
            email: user.email,
            password: "",
            department: user.department,
            role: user.role,
        });
        setForm({ firstName, lastName: rest.join(' '), email: user.email, password: '', department: user.department, role: user.role });
        setAddUserModal(true);
    };

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
                    { id: 'email-templates', label: 'Email Templates', icon: Mail },
                ] as const).map(({ id, label, icon: Icon }) => (
                    <button
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
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 w-64"
                                />
                            </div>
                            <button
                                onClick={handleAddUser}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
                            >
                                <Plus size={14} /> Add User
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
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                                                        {user.initials}
                                                    </div>
                                                    <span className={`font-medium`}>
                                                        {user.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{user.department}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${user.role === 'administrator'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.role === 'administrator' ? 'Administrator' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEditUser(user)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="Edit">
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

            {/* Email Templates Tab */}
            {activeTab === 'email-templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {EMAIL_TEMPLATES.map(template => (
                        <div key={template.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800 text-sm">{template.name}</h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${BADGE_STYLES[template.badge]}`}>
                                    {template.badge.charAt(0).toUpperCase() + template.badge.slice(1)}
                                </span>
                            </div>
                            {/* Mini preview */}
                            <div className="p-4 space-y-2">
                                <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
                                    <p className="text-xs text-slate-700 leading-snug">{template.subject}</p>
                                </div>
                                <div className="text-xs text-slate-600 leading-relaxed line-clamp-3 py-1">
                                    {template.name === 'Document Submitted' && 'Dear {{approver_name}}, A new document has been submitted for your review...'}
                                    {template.name === 'Review Required' && 'Dear {{reviewer_name}}, You have been assigned to review the following document...'}
                                    {template.name === 'Approval Required' && 'Dear {{approver_name}}, The document has completed prior steps and requires your approval...'}
                                    {template.name === 'Revision Requested' && 'Dear {{submitter_name}}, A revision has been requested for your submission...'}
                                    {template.name === 'Document Approved' && 'Dear {{submitter_name}}, Your document has been fully approved by all required approvers...'}
                                    {template.name === 'Document Rejected' && 'Dear {{submitter_name}}, Your document submission has been rejected...'}
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => setTemplateModal(template.id)}
                                        className="flex-1 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add User Modal */}
            <Modal open={addUserModal} onClose={() => setAddUserModal(false)} title="Add New User" size="md">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">First Name</label>
                            <input type="text" placeholder="First name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Last Name</label>
                            <input type="text" placeholder="Last name" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
                        <input type="email" placeholder="user@company.com" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                        <input type="email" placeholder="password123" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">Department</label>
                        <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                            <option>Finance</option>
                            <option>HR</option>
                            <option>Legal</option>
                            <option>IT</option>
                            <option>Procurement</option>
                            <option>Operations</option>
                            <option>Marketing</option>
                            <option>Executive</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">System Role</label>
                        <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white">
                            <option value="user">User</option>
                            <option value="administrator">Administrator</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={() => setAddUserModal(false)}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
                        >
                            Create User
                        </button>
                        <button onClick={() => setAddUserModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50">
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Template Preview Modal */}
            <Modal open={!!templateModal} onClose={() => setTemplateModal(null)} title={previewTemplate?.name || ''} size="lg">
                {previewTemplate && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject Line</p>
                            <p className="text-sm text-slate-800 font-medium">{previewTemplate.subject}</p>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Email header */}
                            <div className="px-5 py-4 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #1b2333 0%, #2d4072 100%)' }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">DF</span>
                                    </div>
                                    <span className="text-white font-semibold text-sm">DocFlow — Document Approval System</span>
                                </div>
                            </div>
                            <div className="px-5 py-5 bg-white text-sm text-slate-700 leading-relaxed">
                                {previewTemplate.preview}
                                <div className="mt-4">
                                    <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}>
                                        View Document →
                                    </button>
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
                                © 2025 Nexus Corporation · DocFlow Document Approval System
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setTemplateModal(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}