import { useEffect, useState } from 'react';
import { listPlans, createPlan, deletePlan, renamePlan } from './lib/plansApi';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';   
import Button from './ui/button'; 


export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const nav = useNavigate();

  // load on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await listPlans();
      if (!error) setPlans(data);
      setLoading(false);
    })();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const { data, error } = await createPlan(newName.trim());
    if (error) return alert('Create failed');
    nav(`/app/${data.id}`);            // ← route defined in 3 B
  }

  async function handleRename(id, curName) {
    const nn = prompt('New name', curName);
    if (nn && nn.trim() && nn !== curName) {
      await renamePlan(id, nn.trim());
      setPlans(p => p.map(pl => pl.id === id ? { ...pl, name: nn.trim() } : pl));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this plan?')) return;
    await deletePlan(id);
    setPlans(p => p.filter(pl => pl.id !== id));
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-blue-800 mb-2">My Vineyard Plans</h1>

      {/* New plan */}
      <div className="flex gap-2">
        <Input
          placeholder="New plan name…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleCreate}>Create</Button>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-gray-600 mt-4">No plans yet.</p>
      ) : (
        <ul className="divide-y border rounded-md bg-white">
          {plans.map(pl => (
            <li key={pl.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <span
                className="font-medium text-blue-700 cursor-pointer"
                onClick={() => nav(`/app/${pl.id}`)}
              >
                {pl.name}
              </span>
              <div className="flex gap-3 text-sm">
                <button onClick={() => handleRename(pl.id, pl.name)} className="text-blue-600">Rename</button>
                <button onClick={() => handleDelete(pl.id)} className="text-red-600">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
