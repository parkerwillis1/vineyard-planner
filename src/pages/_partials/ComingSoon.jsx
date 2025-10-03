export default function ComingSoon({ title, blurb }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-extrabold text-black">{title}</h1>
      <p className="mt-3 text-lg text-gray-600 max-w-2xl">{blurb}</p>
      <div className="mt-8 rounded-xl bg-white p-6 shadow border">
        <p className="text-sm text-gray-700">We’re building this module next.</p>
        <div className="mt-3 flex gap-3">
          <input className="flex-1 rounded-lg border px-4 py-3" placeholder="Email for early access" />
          <button className="rounded-lg bg-green-600 text-white px-5 py-3 hover:bg-green-700">Notify me</button>
        </div>
      </div>
    </section>
  );
}
