/**
 * Lightweight receipt-style detail card matching the success-screen design.
 * `rows`: [{ label, value, tone?: "success", node?: ReactNode }]
 */
export default function ReceiptCard({ rows = [] }) {
  if (!rows.length) return null;

  return (
    <div className="w-full rounded-xl bg-white px-4 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
      <dl className="divide-y divide-gray-100">
        {rows.map(({ label, value, tone, node }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 py-2.5 text-[11px]"
          >
            <dt className="font-semibold text-gray-900">{label}</dt>
            <dd
              className={`max-w-[62%] truncate text-right font-medium ${
                tone === "success" ? "font-semibold text-green-600" : "text-gray-900"
              }`}
              title={typeof (node ?? value) === "string" ? node ?? value : undefined}
            >
              {node ?? value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
