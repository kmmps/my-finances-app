import { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const REVEAL     = 76;
const THRESHOLD  = 60;
const OPEN_EVENT = 'swiperow-open';

interface Props {
  id:       string;
  onEdit:   () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ id, onEdit, onDelete, children }: Props) {
  const [offset,   setOffset]   = useState(0);
  const [snapping, setSnapping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);
  const startX       = useRef(0);
  const startY       = useRef(0);
  const startOff     = useRef(0);
  const isHoriz      = useRef<boolean | null>(null);
  const offsetRef    = useRef(0);

  const snapTo = useCallback((x: number) => {
    offsetRef.current = x;
    setSnapping(true);
    setOffset(x);
  }, []);

  const notifyOpen = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { id } }));
  }, [id]);

  // Close when another row opens
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail.id !== id && offsetRef.current !== 0) snapTo(0);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, [id, snapTo]);

  // Close on tap/click outside
  useEffect(() => {
    if (offset === 0) return;
    const handler = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) snapTo(0);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [offset, snapTo]);

  // ── Touch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (offsetRef.current !== 0) { snapTo(0); return; }
      startX.current  = e.touches[0].clientX;
      startY.current  = e.touches[0].clientY;
      startOff.current = 0;
      isHoriz.current  = null;
      dragging.current = true;
      setSnapping(false);
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy);
      }
      if (!isHoriz.current) return;
      e.preventDefault();
      const clamped = Math.max(-(REVEAL + 20), Math.min(REVEAL + 20, startOff.current + dx));
      offsetRef.current = clamped;
      setSnapping(false);
      setOffset(clamped);
    };

    const onEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      const curr = offsetRef.current;
      if (curr < -THRESHOLD)     { snapTo(-REVEAL); notifyOpen(); }
      else if (curr > THRESHOLD) { snapTo(REVEAL);  notifyOpen(); }
      else                         snapTo(0);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [snapTo, notifyOpen]);

  // ── Mouse ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (offsetRef.current !== 0) { snapTo(0); return; }
      startX.current   = e.clientX;
      startY.current   = e.clientY;
      startOff.current = 0;
      isHoriz.current  = null;
      dragging.current = true;
      setSnapping(false);
    };

    el.addEventListener('mousedown', onDown);
    return () => el.removeEventListener('mousedown', onDown);
  }, [snapTo]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy);
      }
      if (!isHoriz.current) return;
      const clamped = Math.max(-(REVEAL + 20), Math.min(REVEAL + 20, startOff.current + dx));
      offsetRef.current = clamped;
      setSnapping(false);
      setOffset(clamped);
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      const curr = offsetRef.current;
      if (curr < -THRESHOLD)     { snapTo(-REVEAL); notifyOpen(); }
      else if (curr > THRESHOLD) { snapTo(REVEAL);  notifyOpen(); }
      else                         snapTo(0);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, [snapTo, notifyOpen]);

  const handleEdit = () => {
    snapTo(0);
    setTimeout(() => onEdit(), 180);
  };

  const handleDelete = () => {
    snapTo(0);
    setTimeout(() => { if (window.confirm('Excluir esta conta?')) onDelete(); }, 180);
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">

      {/* Edit — absolute left, hidden behind content in default state */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-center bg-blue-600"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleEdit}
          tabIndex={offset > 0 ? 0 : -1}
          aria-label="Editar conta"
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full select-none active:bg-blue-500 transition-colors"
        >
          <Pencil size={18} />
          <span className="text-[10px] font-semibold">Editar</span>
        </button>
      </div>

      {/* Delete — absolute right, hidden behind content in default state */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleDelete}
          tabIndex={offset < 0 ? 0 : -1}
          aria-label="Excluir conta"
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full select-none active:bg-red-500 transition-colors"
        >
          <Trash2 size={18} />
          <span className="text-[10px] font-semibold">Excluir</span>
        </button>
      </div>

      {/*
        Content — MUST be `relative` so CSS stacking puts it above the absolute
        buttons (positioned elements paint in DOM order; without `relative` this
        div is a plain block and paints before the absolute buttons, making them
        always visible on top).
      */}
      <div
        ref={contentRef}
        className={`relative bg-gray-900${snapping ? ' transition-transform duration-200 ease-out' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
