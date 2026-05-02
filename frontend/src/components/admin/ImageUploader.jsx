import React, { useRef, useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon, MoveLeft, MoveRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

/**
 * Drop-in image uploader for admin product form.
 * value: array of image URLs (string[])
 * onChange: (newUrls) => void
 */
const ImageUploader = ({ value = [], onChange }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const toPublicUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${BACKEND_URL}${url}`;
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of files) {
        if (!f.type.startsWith("image/")) {
          toast.error(`${f.name}: ليست صورة`);
          continue;
        }
        if (f.size > 6 * 1024 * 1024) {
          toast.error(`${f.name}: الحجم أكبر من 6MB`);
          continue;
        }
        const form = new FormData();
        form.append("file", f);
        const { data } = await api.post("/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded.push(data.url);
      }
      if (uploaded.length) {
        onChange([...(value || []), ...uploaded]);
        toast.success(`تم رفع ${uploaded.length} صورة`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "فشل الرفع");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const move = (idx, dir) => {
    const next = [...value];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= next.length) return;
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-blush-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blush-400 hover:bg-blush-50/50 transition-colors"
        data-testid="image-dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-blush-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري رفع الصور...
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 mx-auto text-blush-400 mb-2" />
            <p className="text-sm font-semibold text-ink">اسحبي الصور هنا أو اضغطي للاختيار</p>
            <p className="text-[11px] text-ink-muted mt-1">JPG, PNG, WebP — حتى 6MB للصورة</p>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden bg-blush-50 border border-blush-100 group"
              data-testid={`uploaded-image-${i}`}
            >
              <img src={toPublicUrl(url)} alt={`upload ${i}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 right-1 bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  رئيسية
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); move(i, -1); }}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-full bg-white text-ink flex items-center justify-center disabled:opacity-30"
                  aria-label="تحريك يمين"
                >
                  <MoveRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); move(i, 1); }}
                  disabled={i === value.length - 1}
                  className="w-7 h-7 rounded-full bg-white text-ink flex items-center justify-center disabled:opacity-30"
                  aria-label="تحريك يسار"
                >
                  <MoveLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center"
                  aria-label="حذف"
                  data-testid={`remove-image-${i}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
