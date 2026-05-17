import { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const REVEAL    = 76;  // px revealed when snapped open
const THRESHOLD = 40;  // px of swipe needed to trigger snap

interface Props {
  onEdit:   () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onEdit, onDelete, children }: Props) {
  const [offset,  setOffset]  = useState(0);
  const [animate, setAnimate] = useState(false);

  const rowRef     = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startX     = useRef(0);
  const startY     = useRef(0);
  const startOff   = useRef(0);
  const isHoriz    = useRef<boolean | null>(null);
  const dragging   = useRef(false);
  const offsetRef  = useRef(0);   // sync copy of offset, readable in event handlers
  const mouseDown  = useRef(false);

  const snapTo = useCallback((x: number) => {
    offsetRef.current = x;       // sync immediately so handlers see new value
    setAnimate(true);
    setOffset(x);
  }, []);

  // Close when pointer goes down outside this row
  useEffect(() => {
    if (offset === 0) return;
    const close = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) snapTo(0);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [offset, snapTo]);

  // Non-passive touchmove — required to call preventDefault and block scroll
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
      const raw     = startOff.current + dx;
      const clamped = Math.max(-(REVEAL + 16), Math.min(REVEAL + 16, raw));
      offsetRef.current = clamped;
      setAnimate(false);
      setOffset(clamped);
    };

    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  // Global mouse listeners while dragging (desktop: handles pointer leaving element)
  useEffect(() => {
    if (!mouseDown.current) return;

    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      if (isHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy);
      }
      if (!isHoriz.current) return;

      const raw     = startOff.current + dx;
      const clamped = Math.max(-(REVEAL + 16), Math.min(REVEAL + 16, raw));
      offsetRef.current = clamped;
      setAnimate(false);
      setOffset(clamped);
    };

    const onUp = () => {
      mouseDown.current = false;
      dragging.current  = false;
      const curr = offsetRef.current;
      if      (curr < -THRESHOLD) snapTo(-REVEAL);
      else if (curr >  THRESHOLD) snapTo(REVEAL);
      else                         snapTo(0);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
  }, [mouseDown.current, snapTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const endSnap = () => {
    dragging.current = false;
    const curr = offsetRef.current;
    if      (curr < -THRESHOLD) snapTo(-REVEAL);
    else if (curr >  THRESHOLD) snapTo(REVEAL);
    else                         snapTo(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // If already open, close and don't start a new drag
    if (offsetRef.current !== 0) { snapTo(0); return; }
    startX.current   = e.touches[0].clientX;
    startY.current   = e.touches[0].clientY;
    startOff.current = 0;
    isHoriz.current  = null;
    dragging.current = true;
    setAnimate(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (offsetRef.current !== 0) { snapTo(0); return; }
    startX.current    = e.clientX;
    startY.current    = e.clientY;
    startOff.current  = 0;
    isHoriz.current   = null;
    dragging.current  = true;
    mouseDown.current = true;
    setAnimate(false);
  };

  const handleDelete = () => {
    snapTo(0);
    setTimeout(() => {
      if (window.confirm('Excluir esta conta?')) onDelete();
    }, 180);
  };

  const handleEdit = () => {
    snapTo(0);
    setTimeout(() => onEdit(), 180);
  };

  const leftVisible  = offset > 0;
  const rightVisible = offset < 0;

  return (
    <div ref={rowRef} className="relative overflow-hidden">

      {/* ── Edit button (left — revealed by right swipe) ── */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-center bg-blue-600"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleEdit}
          aria-label="Editar conta"
          tabIndex={leftVisible ? 0 : -1}
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full select-none active:bg-blue-500 transition-colors"
        >
          <Pencil size={18} />
          <span className="text-[10px] font-semibold">Editar</span>
        </button>
      </div>

      {/* ── Delete button (right — revealed by left swipe) ── */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600"
        style={{ width: REVEAL }}
      >
        <button
          onClick={handleDelete}
          aria-label="Excluir conta"
          tabIndex={rightVisible ? 0 : -1}
          className="flex flex-col items-center justify-center gap-1 text-white w-full h-full select-none active:bg-red-500 transition-colors"
        >
          <Trash2 size={18} />
          <span className="text-[10px] font-semibold">Excluir</span>
        </button>
      </div>

      {/* ── Sliding content ── */}
      <div
        ref={contentRef}
        style={{ transform: `translateX(${offset}px)` }}
        className={animate ? 'transition-transform duration-200 ease-out' : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={endSnap}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}
