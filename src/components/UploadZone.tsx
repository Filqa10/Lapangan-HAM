'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

type UploadZoneProps = {
  name: string;
  accept?: string;
  required?: boolean;
};

export function UploadZone({ name, accept = 'image/jpeg,image/png,image/webp', required }: UploadZoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    // Attach file to the hidden input via DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) inputRef.current.files = dt.files;
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`cursor-pointer rounded-[4px] border-2 border-dashed p-6 text-center transition ${
        isDragging
          ? 'border-[#5683d2] bg-[#5683d2]/5'
          : fileName
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-500'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        onChange={onChange}
        className="hidden"
      />
      <Upload size={20} className={`mx-auto mb-2.5 ${fileName ? 'text-emerald-500' : 'text-[#999ba3]'}`} />
      {fileName ? (
        <p className="text-sm font-semibold text-emerald-500">{fileName}</p>
      ) : (
        <>
          <p className="text-[14px] font-semibold text-[#0c0a08] dark:text-white">{t('booking.dragDrop')}</p>
          <p className="mt-1 text-[12px] text-[#999ba3]">{t('booking.dragDropSubtext')}</p>
        </>
      )}
      <p className="mt-2 text-[11px] text-[#999ba3]">{t('booking.fileFormats')}</p>
    </div>
  );
}
