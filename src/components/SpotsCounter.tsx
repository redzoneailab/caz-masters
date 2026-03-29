interface SpotsCounterProps {
  filled: number;
  total: number;
}

export default function SpotsCounter({ filled, total }: SpotsCounterProps) {
  const remaining = total - filled;
  const urgency = remaining <= 10 && remaining > 0;
  const full = remaining === 0;

  return (
    <div>
      <p className="text-gold-500 font-black text-sm tracking-[0.2em] uppercase mb-2">SPOTS</p>
      <p className={`text-xl sm:text-2xl font-bold ${full ? "text-red-600" : urgency ? "text-red-500" : "text-navy-900"}`}>
        {full
          ? "Full. Damn."
          : urgency
          ? `${filled} / ${total} — Only ${remaining} Left`
          : `${filled} / ${total} Filled`}
      </p>
    </div>
  );
}
