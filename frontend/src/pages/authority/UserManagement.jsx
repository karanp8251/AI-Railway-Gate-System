import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import GlassCard from '../../components/ui/GlassCard';
import NeonButton from '../../components/ui/NeonButton';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [workerForm, setWorkerForm] = useState({ email: '', displayName: '', password: '' });

  const load = async () => {
    const res = await api.get('/users');
    setUsers(res.data.users || []);
  };

  useEffect(() => { load(); }, []);

  const addWorker = async (e) => {
    e.preventDefault();
    await api.post('/users/worker', workerForm);
    setWorkerForm({ email: '', displayName: '', password: '' });
    load();
  };

  const removeUser = async (uid) => {
    if (!confirm('Remove this user?')) return;
    await api.delete(`/users/${uid}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-green-400">User Management</h2>
      <GlassCard>
        <h3 className="font-display mb-4">Add Railway Worker</h3>
        <form onSubmit={addWorker} className="grid md:grid-cols-3 gap-3">
          <input placeholder="Email" value={workerForm.email} onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} required className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <input placeholder="Name" value={workerForm.displayName} onChange={(e) => setWorkerForm({ ...workerForm, displayName: e.target.value })} required className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <input type="password" placeholder="Password" value={workerForm.password} onChange={(e) => setWorkerForm({ ...workerForm, password: e.target.value })} required className="px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-700" />
          <NeonButton type="submit" className="md:col-span-3">Add Worker</NeonButton>
        </form>
      </GlassCard>
      <GlassCard>
        <h3 className="font-display mb-4">All Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-slate-800/50">
                  <td className="py-3">{u.email}</td>
                  <td>{u.displayName}</td>
                  <td className="text-cyan-400">{u.role}</td>
                  <td>
                    <button onClick={() => removeUser(u.uid)} className="text-red-400 hover:underline text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
