import { getCategory } from '@/lib/categories';

export default function CategoryBadge({ categoryId }: { categoryId: string }) {
  const cat = getCategory(categoryId);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[11px] font-semibold"
      style={{ borderColor: `${cat.color}55`, color: cat.color, background: `${cat.color}1a` }}
    >
      <span>{cat.icon}</span>
      {cat.label}
    </span>
  );
}
