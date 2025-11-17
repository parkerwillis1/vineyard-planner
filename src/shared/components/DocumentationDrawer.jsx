import React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";

export function DocumentationDrawer({ open, onClose }) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-6 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-1"
          onClick={onClose}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold mb-4">Documentation</h2>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Financial Inputs</h3>
          <ul className="list-disc ml-5">
            <li><strong>Acres</strong>: number of vineyard acres.</li>
            <li><strong>Bottle $</strong>: your per-bottle sales price.</li>
            <li><strong>Op $/yr</strong>: annual operating costs.</li>
            <li><strong>Water $/ac-yr</strong>: annual water & labor cost per acre.</li>
            <li><strong>Land $/ac</strong>: purchase price per acre.</li>
            <li><strong>Build $/ac</strong>: install/trellis etc. per acre.</li>
            <li><strong>Setup Year</strong>: which year you pay all capital costs.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Setup Items</h3>
          <p>One-time costs you tick:</p>
          <ul className="list-disc ml-5">
            <li><strong>SitePrep, Trellis, Vines, Fence</strong>: per-acre build line-items.</li>
            <li><strong>Irrigation</strong>: pick your system (drip/sprinkler/none) and it fills the cost per acre.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Unsold Bottles & Grapes</h3>
          <p>
            Any “unsold bottles” entry subtracts from that year’s production,
            lowering revenue.
          </p>
          <p>
            You can also “purchase grapes” by variety/lb—those go into annual cost.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-1">10-Year Summary</h3>
          <p>
            Shows Year 1–10: Tons/Ac, unsold, sold, revenue, cost, net and cumulative
            cash‐flow.  Negative nets are red, positive are green.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-1">Details Chart</h3>
          <p>
            A bar-chart and table breaking down your annual & one-time costs:
            operating, water, insurance, loans, equipment, grape purchases,
            setup capital and licensing.
          </p>
        </section>
      </div>
    </div>,
    document.body
  );
}
