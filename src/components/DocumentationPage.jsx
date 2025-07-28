// src/components/DocumentationPage.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * 📚 Vineyard Financial Planner – Full User Guide
 *
 * ▸ A single long page, broken into clear, scroll‑friendly sections.
 * ▸ Uses native Tailwind prose classes for comfortable reading.
 * ▸ Covers: concept overview ▸ quick‑start checklist ▸ tab‑by‑tab field
 *   reference ▸ financial logic & formulas ▸ FAQ / troubleshooting.
 */
export default function DocumentationPage() {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-12 prose prose-blue">
      {/* back link */}
      <Link to="/" className="no-underline text-blue-600 hover:underline">
        ← Back to Planner
      </Link>

      {/* -------------------------------------------------- */}
      {/* 1 ▸ INTRODUCTION                                  */}
      {/* -------------------------------------------------- */}
      <section>
        <h1 className="!mb-2 flex items-center gap-2">
          📄 Vineyard Planner Documentation
        </h1>
        <p className="lead !mb-4">
          This guide explains <strong>why</strong> the Vineyard Financial
          Planner exists and <strong>how</strong> to use every field, slider,
          and switch to build a bullet‑proof 1–30&nbsp;year pro‑forma for a
          small‑to‑mid‑sized vineyard / estate winery.
        </p>
        <blockquote>
          The model is designed for
          <em> owner‑operators</em> who plan to (a) grow grapes,
          (b) vinify, bottle and sell their own wine,
          (c) sell all grape yields to other wineries, and optionally
          (d) purchase outside fruit to scale production.
          It balances simplicity with enough rigor to satisfy lenders
          and investors.
        </blockquote>
      </section>

      {/* -------------------------------------------------- */}
      {/* 2 ▸ QUICK‑START CHECKLIST                         */}
      {/* -------------------------------------------------- */}
      <section>
        <h2>🚀 Quick‑Start (five‑minute) Checklist</h2>
        <ol className="list-decimal pl-6 space-y-2">

          {/* ① – My Plans */}
          <li>
            Click <strong className="text-blue-600">My Plans</strong> in the
            left sidebar &nbsp;→&nbsp; <em>New Plan</em>. Give it a name (e.g.&nbsp;
            <code>“5‑acre Hilltop”</code>) and press <strong>Create</strong>.
            Every change you make is now saved under that plan.
          </li>

          {/* ② – projection years */}
          <li>
            At the very top of the planner set your
            <strong> Projection&nbsp;Years</strong> (1 – 30).
          </li>

          {/* ③ – core vineyard parameters */}
          <li>
            In <em>Financial Inputs ▸ Core Vineyard Parameters</em> enter acreage,
            land cost, build cost and choose either
            <strong> Bottle Wine</strong> or
            <strong> Sell All Grapes</strong>.
          </li>

          {/* ④ – setup items */}
          <li>
            Toggle any <strong>Setup Items</strong> you plan to install
            (trellis, irrigation, etc.) and adjust their $/acre.
          </li>

          {/* ⑤ – equipment / loans */}
          <li>
            Add financed <strong>Equipment</strong> and any additional
            <strong> Loans</strong> (rates &amp; terms are editable).
          </li>

          {/* ⑥ – projection review */}
          <li>
            Jump to the <em>{`<Projection>`}</em> tab – review break‑even,
            year‑by‑year cash‑flow and tweak assumptions until satisfied.
          </li>
        </ol>

        <p className="!mt-4">
          💡 <em>Tip:</em> Every numeric field updates instantly – keep an eye on
          the purple “Total Investment” chip and the blue/green/red KPIs in each
          tab.
        </p>
      </section>

      {/* -------------------------------------------------- */}
      {/* 3 ▸ TAB‑BY‑TAB REFERENCE                          */}
      {/* -------------------------------------------------- */}
      <section>
        <h2>📑 Tab‑by‑Tab Reference</h2>

        {/* 3.1 Financial Inputs */}
        <h3>1. Financial Inputs</h3>
        <p>
          Everything that drives the model – acreage, prices, one‑time &amp;
          recurring costs, loans and purchases.
        </p>

        <details open>
          <summary className="cursor-pointer font-semibold">
            Core Vineyard Parameters
          </summary>
          <dl className="pl-4 space-y-2">
            <div><dt>Acres</dt><dd>Planted acres (scales nearly every cost &amp; yield figure).</dd></div>
            <div><dt>Sales Strategy</dt><dd>
              <strong>Bottle Wine</strong> or <strong>Sell All Grapes</strong>.
              Switching rewires the revenue formula and reveals the relevant
              price field.
            </dd></div>
            <div><dt>Bottle Price ($)</dt><dd>Visible only in Bottle mode.</dd></div>
            <div><dt>Grape Sale Price ($/ton)</dt><dd>Visible only in Bulk‑Grape mode.</dd></div>
            <div><dt>Operating Cost ($/yr)</dt><dd>Auto‑calculated from all operating sections below.</dd></div>
            <div><dt>Water Cost ($/ac‑yr)</dt><dd>Annual irrigation &amp; pumping cost.</dd></div>
            <div><dt>Land Price ($/ac)</dt><dd>Year‑0 purchase price.</dd></div>
            <div><dt>Build Cost ($/ac)</dt><dd>Winery / barn construction per acre.</dd></div>
          </dl>
        </details>

        <details>
          <summary className="cursor-pointer font-semibold">Setup Items</summary>
          <p>One‑time per‑acre capital outlays. Switch on/off to include or skip.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Site Prep :</strong> Clearing, ripping, soil‑work.</li>
            <li><strong>Trellis :</strong> Posts, wire, anchors.</li>
            <li><strong>Irrigation :</strong> Choose Drip / Sprinkler – cost field updates automatically.</li>
            <li><strong>Vines :</strong> Plant material + labor.</li>
            <li><strong>Fence :</strong> Deer / hog exclusion.</li>
          </ul>
        </details>

        <details>
          <summary className="cursor-pointer font-semibold">Insurance &amp; Licensing</summary>
          <ul className="list-disc pl-5">
            <li>Toggle <strong>Include Insurance</strong> to add the annual premium.</li>
            <li><strong>License Cost</strong> covers state / federal permits; paid in the setup year.</li>
          </ul>
        </details>

        <details>
          <summary className="cursor-pointer font-semibold">Equipment (Financed)</summary>
          <p>Each row is a loan‑amortised purchase. Monthly / annual payments use the standard&nbsp;<code>PMT()</code> formula.</p>
        </details>

        {/* 3.2 Vineyard Establishment */}
        <h3>2. Vineyard Establishment</h3>
        <p>
          Visual “Year 0 cost sheet” – bar + pie charts show where capital is allocated.
          Includes a financing summary and <em>Net Capital Required</em>.
        </p>

        {/* 3.3 Projection */}
        <h3>3. {`<Projection>`} (1–30 years)</h3>
        <ul className="list-disc pl-5">
          <li><strong>Break‑Even Year</strong> – first year cumulative cash‑flow turns positive.</li>
          <li>Interactive stacked bar chart of revenue / cost / net.</li>
          <li>Detailed table underneath for export to Excel/CSV (copy‑paste).</li>
        </ul>

        {/* 3.4 Details */}
        <h3>4. Details</h3>
        <p>
          Deep‑dive analytics: cost distribution, sensitivity scenarios, break‑even
          chart, bottle economics, marketing strategy and key lender ratios.
        </p>
      </section>

      {/* -------------------------------------------------- */}
      {/* 4 ▸ FINANCIAL LOGIC & FORMULAS                     */}
      {/* -------------------------------------------------- */}
      <section>
        <h2>📊 Financial Logic &amp; Formulas</h2>
        <table>
          <thead><tr><th>Metric</th><th>Formula</th></tr></thead>
          <tbody>
            <tr><td>Yield (bottles)</td><td><code>Acres × Tons/ac × 756</code></td></tr>
            <tr><td>Revenue (Bottle mode)</td><td><code>Bottles Sold × Bottle Price</code></td></tr>
            <tr><td>Revenue (Bulk‑Grape mode)</td><td><code>Tons Sold × Grape Price</code></td></tr>
            <tr><td>Net Profit</td><td><code>Revenue − Cost</code></td></tr>
            <tr><td>Cumulative CF</td><td><code>Σ Net Profit to Year n</code></td></tr>
            <tr><td>LTC</td><td><code>Total Loans ÷ Total Project Cost</code></td></tr>
            <tr><td>LTV</td><td><code>Total Loans ÷ (Land + Improvements)</code></td></tr>
          </tbody>
        </table>
      </section>

      {/* -------------------------------------------------- */}
      {/* 5 ▸ FAQ / TROUBLESHOOTING                          */}
      {/* -------------------------------------------------- */}
      <section>
        <h2>❓ FAQ &amp; Troubleshooting</h2>
        <details>
          <summary>Why is my break‑even year “&gt; 30”?</summary>
          <p>
            Your combined operating cost + debt service is larger than max
            revenue at full production. Lower debt, raise price, increase acreage
            or cut costs.
          </p>
        </details>

        <details>
          <summary>The PMT looks too high / too low.</summary>
          <p>
            Remember the <code>Rate</code> field is APR %, not a decimal.<br />
            Example: 6 % APR on a 5‑year note → enter <code>6</code>, not
            <code>0.06</code>.
          </p>
        </details>
      </section>
    </div>
  );
}