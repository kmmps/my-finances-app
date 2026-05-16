import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Download, FileText, Copy, Check, X, ScanLine, FileCheck2 } from 'lucide-react';
import Modal from '../ui/Modal';
import type { Attachment, AttachTab, Bill } from '../../types';
import { generateId, formatFileSize } from '../../utils';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

interface Props {
  bill: Bill;
  initialTab: AttachTab;
  onUpdate: (bill: Bill) => void;
  onClose: () => void;
}

function readFile(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE) { reject(new Error(`"${file.name}" é muito grande (máx. 2 MB).`)); return; }
    const isImage = file.type.startsWith('image/');
    const isPdf   = file.type === 'application/pdf';
    if (!isImage && !isPdf) { reject(new Error(`"${file.name}" inválido. Use imagem ou PDF.`)); return; }
    const reader = new FileReader();
    reader.onload = e => resolve({
      id: generateId(), name: file.name, mimeType: file.type,
      data: e.target!.result as string, size: file.size,
    });
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

function UploadZone({ onFiles, label }: { onFiles: (files: FileList) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); }}
        className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-500/60 rounded-xl py-4 flex flex-col items-center gap-1.5 text-gray-500 hover:text-emerald-400 transition-all"
      >
        <Upload size={18} />
        <span className="text-xs font-medium">{label ?? 'Clique ou arraste o arquivo'}</span>
        <span className="text-[10px] text-gray-600">PDF ou imagem · máx. 2 MB</span>
      </button>
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }} />
    </>
  );
}

function AttachmentRow({ att, onDelete, onDownload }: {
  att: Attachment;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const isImage = att.mimeType.startsWith('image/');
  return (
    <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
      {isImage ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-700">
          <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-red-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate">{att.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(att.size)}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onDownload} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Baixar">
          <Download size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Remover">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function AttachmentModal({ bill, initialTab, onUpdate, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<AttachTab>(initialTab);
  const [pixCode, setPixCode] = useState(bill.boleto.pixCode);
  const [copied, setCopied] = useState(false);

  const update = useCallback((partial: Partial<Bill>) => {
    onUpdate({ ...bill, ...partial });
  }, [bill, onUpdate]);

  const handlePixBlur = () => {
    if (pixCode !== bill.boleto.pixCode) {
      update({ boleto: { ...bill.boleto, pixCode } });
    }
  };

  const handlePixClear = () => {
    setPixCode('');
    update({ boleto: { ...bill.boleto, pixCode: '' } });
  };

  const handleCopyPix = async () => {
    if (!pixCode) return;
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBoletoFiles = async (files: FileList) => {
    try {
      const att = await readFile(files[0]!);
      // Use local pixCode state so unsaved text isn't lost
      update({ boleto: { pixCode, file: att } });
    } catch (e) { alert((e as Error).message); }
  };

  const handleBoletoDelete = () => {
    update({ boleto: { pixCode, file: null } });
  };

  const handleComproFiles = async (files: FileList) => {
    const added: Attachment[] = [];
    for (const f of Array.from(files)) {
      try { added.push(await readFile(f)); } catch (e) { alert((e as Error).message); }
    }
    if (added.length) update({ comprovantes: [...bill.comprovantes, ...added] });
  };

  const handleComproDelete = (id: string) => {
    update({ comprovantes: bill.comprovantes.filter(a => a.id !== id) });
  };

  const download = (att: Attachment) => {
    const a = document.createElement('a');
    a.href = att.data; a.download = att.name; a.click();
  };

  const hasBoleto = !!(bill.boleto.pixCode || bill.boleto.file);
  const hasCompro = bill.comprovantes.length > 0;

  const Tab = ({ id, label, icon, active }: { id: AttachTab; label: string; icon: React.ReactNode; active: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <Modal title={`Anexos — ${bill.name}`} onClose={onClose}>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 mb-4">
        <Tab
          id="boleto"
          label="Boleto / Pix"
          icon={
            <span className={`relative ${hasBoleto ? 'text-blue-400' : ''}`}>
              <ScanLine size={15} />
              {hasBoleto && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </span>
          }
          active={activeTab === 'boleto'}
        />
        <Tab
          id="comprovante"
          label="Comprovante"
          icon={
            <span className={`relative ${hasCompro ? 'text-emerald-400' : ''}`}>
              <FileCheck2 size={15} />
              {hasCompro && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </span>
          }
          active={activeTab === 'comprovante'}
        />
      </div>

      {/* ── Boleto/Pix tab ─────────────────────────────────────── */}
      {activeTab === 'boleto' && (
        <div className="space-y-4">
          {/* Pix code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">Código Pix (copia e cola)</label>
              <div className="flex gap-1">
                {pixCode && (
                  <>
                    <button
                      onClick={handleCopyPix}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
                    >
                      {copied ? <Check size={10} /> : <Copy size={10} />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      onClick={handlePixClear}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
                    >
                      <X size={10} /> Limpar
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              value={pixCode}
              onChange={e => setPixCode(e.target.value)}
              onBlur={handlePixBlur}
              placeholder="Cole o código Pix aqui..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Boleto file */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Arquivo (PDF ou imagem)</label>
            {bill.boleto.file ? (
              <AttachmentRow
                att={bill.boleto.file}
                onDelete={handleBoletoDelete}
                onDownload={() => download(bill.boleto.file!)}
              />
            ) : (
              <UploadZone onFiles={handleBoletoFiles} label="Adicionar boleto (substitui anterior)" />
            )}
          </div>
        </div>
      )}

      {/* ── Comprovante tab ────────────────────────────────────── */}
      {activeTab === 'comprovante' && (
        <div className="space-y-3">
          <UploadZone onFiles={handleComproFiles} label="Adicionar comprovante(s)" />

          {bill.comprovantes.length === 0 ? (
            <div className="text-center py-4">
              <FileCheck2 size={28} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-gray-600">Nenhum comprovante ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bill.comprovantes.map(att => (
                <AttachmentRow
                  key={att.id}
                  att={att}
                  onDelete={() => handleComproDelete(att.id)}
                  onDownload={() => download(att)}
                />
              ))}
            </div>
          )}

          {/* Image grid preview */}
          {bill.comprovantes.some(a => a.mimeType.startsWith('image/')) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {bill.comprovantes
                .filter(a => a.mimeType.startsWith('image/'))
                .map(att => (
                  <div key={att.id} className="relative rounded-xl overflow-hidden aspect-video bg-gray-800">
                    <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-1.5 left-2 right-2 text-[10px] text-white truncate">{att.name}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
