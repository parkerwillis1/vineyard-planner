import { useEffect, useState } from 'react';
import { listPlans, createPlan, deletePlan, renamePlan } from '../lib/plansApi';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import Button from './ui/button';
import { useTierLimits } from '../hooks/useTierLimits';
import { UpgradeModal } from './UpgradeModal';
import { AlertCircle } from 'lucide-react';


export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const nav = useNavigate();
  const { wouldExceedLimit, tierLimits, getUsageDisplay, tierId } = useTierLimits();

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

    // Check plan limit
    if (wouldExceedLimit('plans', plans.length)) {
      setShowUpgradeModal(true);
      return;
    }

    const { data, error } = await createPlan(newName.trim());
    if (error) return alert('Create failed');
    setNewName('');
    setPlans(p => [...p, data]);
    nav(`/planner/${data.id}`);
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

  const isAtLimit = tierLimits.plans !== -1 && plans.length >= tierLimits.plans;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-blue-800 mb-2">My Vineyard Plans</h1>

      {/* Plan limit indicator */}
      {tierLimits.plans !== -1 && (
        <div className={`text-sm p-3 rounded-md ${isAtLimit ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center gap-2">
            {isAtLimit && <AlertCircle className="w-4 h-4 text-amber-600" />}
            <span className={isAtLimit ? 'text-amber-800 font-medium' : 'text-gray-700'}>
              Plans: {getUsageDisplay('plans', plans.length)}
            </span>
          </div>
          {isAtLimit && (
            <p className="text-xs text-amber-600 mt-1">
              You've reached your plan limit. Upgrade to create more plans.
            </p>
          )}
        </div>
      )}

      {/* New plan */}
      <div className="flex gap-2">
        <Input
          placeholder="New plan name…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleCreate()}
          className="flex-grow"
          disabled={isAtLimit}
        />
        <Button
          onClick={handleCreate}
          disabled={isAtLimit || !newName.trim()}
        >
          {isAtLimit ? 'Limit Reached' : 'Create'}
        </Button>
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
                onClick={() => nav(`/planner/${pl.id}`)}
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          moduleId="planner"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
