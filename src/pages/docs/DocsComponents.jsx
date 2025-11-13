import { AlertCircle, CheckCircle, Info, Lightbulb, Code2 } from "lucide-react";

// Page Header
export function DocsHeader({ title, subtitle }) {
  return (
    <div className="mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      {subtitle && <p className="text-xl text-gray-600 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

// Section Heading
export function Section({ title, id, children }) {
  return (
    <section className="mb-12" id={id}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

// Subsection Heading
export function Subsection({ title, id, children }) {
  return (
    <div className="mb-8" id={id}>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

// Callout boxes (Note, Warning, Tip, Success)
export function Callout({ type = "note", title, children }) {
  const styles = {
    note: {
      container: "bg-blue-50 border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      title: "text-blue-900",
      text: "text-blue-800",
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200",
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      title: "text-yellow-900",
      text: "text-yellow-800",
    },
    tip: {
      container: "bg-green-50 border-green-200",
      icon: <Lightbulb className="w-5 h-5 text-green-600" />,
      title: "text-green-900",
      text: "text-green-800",
    },
    success: {
      container: "bg-emerald-50 border-emerald-200",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      title: "text-emerald-900",
      text: "text-emerald-800",
    },
  };

  const style = styles[type] || styles.note;

  return (
    <div className={`border rounded-lg p-4 my-6 ${style.container}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          {title && <div className={`font-semibold mb-1 ${style.title}`}>{title}</div>}
          <div className={`text-sm ${style.text}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Code Block
export function CodeBlock({ language = "javascript", code }) {
  return (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 uppercase">{language}</span>
        </div>
        <button className="text-xs text-gray-400 hover:text-white transition-colors">
          Copy
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Inline Code
export function InlineCode({ children }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">
      {children}
    </code>
  );
}

// Parameter List (for API-style docs)
export function ParamList({ params }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden my-6">
      {params.map((param, index) => (
        <div
          key={param.name}
          className={`px-4 py-4 ${index !== params.length - 1 ? "border-b border-gray-200" : ""}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <code className="text-sm font-semibold text-gray-900">{param.name}</code>
                {param.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    required
                  </span>
                )}
                {param.type && (
                  <span className="text-xs text-gray-500 font-mono">{param.type}</span>
                )}
              </div>
              <p className="text-sm text-gray-600">{param.description}</p>
              {param.default && (
                <div className="mt-2 text-xs text-gray-500">
                  Default: <code className="bg-gray-100 px-1 rounded">{param.default}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Step-by-step guide
export function Steps({ steps }) {
  return (
    <div className="space-y-6 my-8">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0 w-8 h-8 bg-vine-green-100 text-vine-green-700 rounded-full flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>
          <div className="flex-1 pt-1">
            <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            {step.code && <CodeBlock language={step.language || "javascript"} code={step.code} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// Feature Grid (for overview pages)
export function FeatureGrid({ features }) {
  return (
    <div className="grid sm:grid-cols-2 gap-6 my-8">
      {features.map((feature, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-6 hover:border-vine-green-300 hover:shadow-md transition-all"
        >
          {feature.icon && <div className="mb-3">{feature.icon}</div>}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
          {feature.link && (
            <a href={feature.link} className="text-sm text-vine-green-600 hover:text-vine-green-700 font-medium mt-3 inline-block">
              Learn more →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// Table
export function Table({ headers, rows }) {
  return (
    <div className="my-6 overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Next Steps / Related Pages
export function NextSteps({ links }) {
  return (
    <div className="mt-16 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="block p-4 border border-gray-200 rounded-lg hover:border-vine-green-300 hover:shadow-md transition-all group"
          >
            <div className="font-semibold text-gray-900 group-hover:text-vine-green-600 mb-1">
              {link.title} →
            </div>
            <p className="text-sm text-gray-600">{link.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
