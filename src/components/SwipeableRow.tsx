import { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const REVEAL     = 76;           // px revealed when snapped
const THRESHOLD  = 40;           // px of drag needed to snap open
const OPEN_EVENT = 'swiperow-open';

interface Props {
  id:       string;
  onEdit:   () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ id, onEdit, onDelete, children }: Props) {
  const [offset,          setOffset]          = useState(0);
  const [animate,         setAnimate]         = useState(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);

  const rowRef     = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startX     = useRef(0);
  const startY     = useRef(0);
  const startOff   = useRef(0);
  const isHoriz    = useRef<boolean | null>(null);
  const dragging   = useRef(false);
  const offsetRef  = useRef(0);  // mirror of offset, safe to read in event handlers

  const snapTo = useCallback((x: number) => {
    offsetRef.current = x;
    setAnimate(true);
    setOffset(x);
  }, []);

  const notifyOpen = useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { rowId: id } }));
  }, [id]);

  // Close when another row broadcasts it opened
  useEffect(() => {
    const handler = (e: Event) => {
      const { rowId } = (e as CustomEvent<{ rowId: string }>).detail;
      if (rowId !== id && offsetRef.current !== 0) snapTo(0);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, [id, snapTo]);

  // Close when pointerdown lands outside this row
  useEffect(() => {
    if (offset === 0) return;
    const close = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) snapTo(0);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [offset, snapTo]);

  // Non-passive touchmove so we can call preventDefault and block scroll
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy);
      }
      if (!isHoriz.current) return;
      e.preventDefault();
      const clamped = Math.max(-(REVEAL + 16), Math.min(REVEAL + 16, startOff.current + dx));
      offsetRef.current = clamped;
      setAnimate(false);
      setOffset(clamped);
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  // Global mousemove/mouseup while desktop drag is active
  useEffect(() => {
    if (!isMouseDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy);
      }
      if (!isHoriz.current) return;
      const clamped = Math.max(-(REVEAL + 16), Math.min(REVEAL + 16, startOff.current + dx));
      offsetRef.current = clamped;
      setAnimate(false);
      setOffset(clamped);
    };
    const onUp = () => {
      dragging.current = false;
      setIsMouseDragging(false);
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
  }, [isMouseDragging, snapTo, notifyOpen]);

  const endSnap = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const curr = offsetRef.current;
    if (curr < -THRESHOLD)     { snapTo(-REVEAL); notifyOpen(); }
    else if (curr > THRESHOLD) { snapTo(REVEAL);  notifyOpen(); }
    else                         snapTo(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (offsetRef.current !== 0) { snapTo(0); return; }  // tap to close
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    startOff.current = 0;
    isHoriz.current  = null;
    dragging.current = true;
    setAnimate(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (offsetRef.current !== 0) { snapTo(0); return; }  // click to close
    startX.current   = e.clientX;
    startY.current   = e.clientY;
    startOff.current = 0;
    isHoriz.current  = null;
    dragging.current = true;
    setIsMouseDragging(true);
    setAnimate(false);
  };

  const handleDelete = () => {
    snapTo(0);
    setTimeout(() => { if (window.confirm('Excluir esta conta?')) onDelete(); }, 180);
  };

  const handleEdit = () => {
    snapTo(0);
    setTimeout(() => onEdit(), 180);
  };

  const leftVisible  = offset > 0;
  const rightVisible = offset < 0;

  return (
    <div ref={rowRef} className="relative overflow-hidden">

      {/* Edit — left side, revealed by right swipe */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-center bg-blue-600"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleEdit}
          tabIndex={leftVisible ? 0 : -1}
          aria-label="Editar conta"
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full select-none active:bg-blue-500 transition-colors"
        >
          <Pencil size={18} />
          <span className="text-[10px] font-semibold">Editar</span>
        </button>
      </div>

      {/* Delete — right side, revealed by left swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleDelete}
          tabIndex={rightVisible ? 0 : -1}
          aria-label="Excluir conta"
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full select-none active:bg-red-500 transition-colors"
        >
          <Trash2 size={18} />
          <span className="text-[10px] font-semibold">Excluir</span>
        </button>
      </div>

      {/* Sliding content — bg-gray-900 is essential: covers the buttons behind */}
      <div
        ref={contentRef}
        style={{ transform: `translateX(${offset}px)` }}
        className={`bg-gray-900${animate ? ' transition-transform duration-200 ease-out' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={endSnap}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}
