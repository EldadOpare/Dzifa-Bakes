import { ImagePlus, Loader2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { uploadImage } from '../lib/upload-image';

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  testId: string;
};

export function ImageUploadField({ label, value, onChange, onUploadingChange, testId }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that photo. Try again.');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="text-xs font-semibold sm:col-span-2">
      {label}
      <div className="mt-2 flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-14 w-14 rounded-lg border border-border object-cover" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
            <ImagePlus size={18} />
          </div>
        )}
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-xs font-normal text-foreground hover:bg-muted">
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading…</>
          ) : (
            value ? 'Replace photo' : 'Upload photo'
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} disabled={uploading} data-testid={testId} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs font-normal text-muted-foreground hover:text-destructive">
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-normal text-destructive">{error}</p>}
    </div>
  );
}
