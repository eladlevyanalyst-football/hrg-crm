"use client";
export default function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className={`card mt-10 w-full ${wide ? "max-w-3xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="text-2xl leading-none text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="סגור">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
