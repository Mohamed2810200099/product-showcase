import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, GripVertical } from "lucide-react";

type Bucket = "products" | "categories" | "testimonials" | "media";

type Props = {
  bucket: Bucket;
  value: string[]; // public URLs
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  max?: number;
  folder?: string;
};

const PUBLIC_URL = (bucket: string, path: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

export function ImageUploader({ bucket, value, onChange, multiple = true, max = 8, folder = "" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (!arr.length) return;
      const remaining = multiple ? Math.max(0, max - value.length) : 1;
      const toUpload = multiple ? arr.slice(0, remaining) : arr.slice(0, 1);
      if (!toUpload.length) {
        toast.error(`الحد الأقصى ${max} صور`);
        return;
      }

      setUploading(true);
      const newUrls: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: ملف غير صالح`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: الحجم أكبر من 5MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = folder ? `${folder}/${safeName}` : safeName;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (error) {
          console.error(error);
          toast.error(`فشل رفع ${file.name}`);
          continue;
        }
        newUrls.push(PUBLIC_URL(bucket, path));
      }
      setUploading(false);
      if (newUrls.length) {
        onChange(multiple ? [...value, ...newUrls] : newUrls);
        toast.success(`تم رفع ${newUrls.length} صورة`);
      }
    },
    [bucket, folder, max, multiple, onChange, value],
  );

  const remove = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-secondary/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> جاري الرفع…
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-sm font-medium">اسحبي الصور هنا أو اضغطي للاختيار</div>
            <div className="text-xs text-muted-foreground mt-1">
              JPG / PNG / WebP — حتى 5MB لكل صورة {multiple && `(${value.length}/${max})`}
            </div>
          </>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {value.map((url, idx) => (
            <div key={url} className="relative group rounded-lg overflow-hidden border border-border bg-card aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {idx === 0 && multiple && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">رئيسية</span>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                aria-label="حذف"
              >
                <X className="h-3 w-3" />
              </button>
              {multiple && value.length > 1 && (
                <div className="absolute bottom-1 right-1 left-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    className="bg-card/90 rounded p-1 text-xs disabled:opacity-30"
                  >
                    →
                  </button>
                  <GripVertical className="h-3 w-3 text-muted-foreground self-center" />
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === value.length - 1}
                    className="bg-card/90 rounded p-1 text-xs disabled:opacity-30"
                  >
                    ←
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
