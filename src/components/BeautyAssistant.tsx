import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Sparkles, X, ShoppingBag, ArrowRight, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { useBrand } from "@/hooks/use-brand";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import placeholderImg from "@/assets/product-placeholder.jpg";

type Goal =
  | "hair_growth"
  | "hair_repair"
  | "hair_frizz"
  | "skin_glow"
  | "skin_hydrate"
  | "skin_oily";

type RoutineSize = "single" | "duo" | "full";

const GOALS: { id: Goal; label: string; type: "hair" | "skin"; routineName: string; intro: string }[] = [
  { id: "hair_growth", label: "نمو وكثافة الشعر", type: "hair", routineName: "روتين تكثيف ونمو الشعر", intro: "منتجات تساعد على تحفيز فروة الرأس وتغذية الشعر." },
  { id: "hair_repair", label: "إصلاح الشعر المتضرر", type: "hair", routineName: "روتين إصلاح الشعر المتضرر", intro: "هذه المنتجات مناسبة للشعر المتضرر أو المعالج كيميائيًا، وتساعد على تحسين النعومة وتقليل مظهر التقصف." },
  { id: "hair_frizz", label: "تقليل الهيشان ولمعان الشعر", type: "hair", routineName: "روتين النعومة واللمعان", intro: "تركيبة لتنعيم الشعر، تقليل الهيشان، وإضفاء لمعان طبيعي." },
  { id: "skin_glow", label: "نضارة وإشراقة البشرة", type: "skin", routineName: "روتين النضارة والإشراقة", intro: "منتجات لإشراق البشرة وتوحيد لونها." },
  { id: "skin_hydrate", label: "ترطيب وتهدئة البشرة", type: "skin", routineName: "روتين الترطيب والتهدئة", intro: "تركيبة لطيفة لترطيب وتهدئة البشرة." },
  { id: "skin_oily", label: "البشرة الدهنية والرؤوس السوداء", type: "skin", routineName: "روتين تنقية البشرة الدهنية", intro: "منتجات لتقليل الدهون وتنظيف المسام بعمق." },
];

// Map by product order_index (1-based per user spec)
const RECS: Record<Goal, number[]> = {
  hair_growth: [1, 14],
  hair_repair: [2, 3, 4, 6, 15],
  hair_frizz: [14, 16, 6],
  skin_glow: [5, 8, 11],
  skin_hydrate: [10, 12, 13],
  skin_oily: [7, 9, 17, 18, 19],
};

const HAIR_DESC = ["جاف", "هايش", "متقصف", "مصبوغ أو معالج كيميائيًا", "ضعيف أو محتاج كثافة"];
const SKIN_DESC = ["دهنية", "جافة", "مختلطة", "عادية", "حساسة", "فيها رؤوس سوداء أو حبوب"];

type Step = "intro" | "goal" | "size" | "describe" | "result";

export function BeautyAssistant({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [step, setStep] = useState<Step>("intro");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [size, setSize] = useState<RoutineSize | null>(null);
  const [, setDescribe] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const brand = useBrand();
  const { add } = useCart();

  const { data: products = [] } = useQuery({
    queryKey: ["assistant-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,arabic_title,slug,price,images,order_index")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      return data ?? [];
    },
  });

  const recommended = useMemo(() => {
    if (!goal || !size) return [] as any[];
    const indexes = RECS[goal];
    const limited = size === "single" ? indexes.slice(0, 1) : size === "duo" ? indexes.slice(0, 2) : indexes;
    return limited
      .map((idx) => products.find((p: any) => p.order_index === idx))
      .filter(Boolean);
  }, [goal, size, products]);

  const total = recommended.reduce((s: number, p: any) => s + Number(p.price ?? 0), 0);
  const goalDef = goal ? GOALS.find((g) => g.id === goal)! : null;

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [step, goal, size]);

  const reset = () => { setStep("intro"); setGoal(null); setSize(null); setDescribe(null); };

  const addRoutineToCart = () => {
    recommended.forEach((p: any) => {
      const img = (p.images && p.images.length > 0 ? p.images[0] : null) ?? placeholderImg;
      add({ id: p.id, name: p.arabic_title || p.name, slug: p.slug, price: Number(p.price), image: img }, 1);
    });
    toast.success("تمت إضافة الروتين للسلة 💕");
  };

  const waMsg = goalDef && recommended.length
    ? `مرحبًا، أريد المساعدة في اختيار روتين مناسب من The Girl House.\nالهدف: ${goalDef.label}\nالروتين المقترح: ${goalDef.routineName}\nالمنتجات المقترحة:\n${recommended.map((p: any) => `- ${p.arabic_title || p.name}`).join("\n")}`
    : "";

  const Bubble = ({ children, side = "bot" }: { children: React.ReactNode; side?: "bot" | "user" }) => (
    <div className={`flex ${side === "user" ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${side === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-white/80 backdrop-blur border border-white/70 text-[#3A2430] rounded-bl-sm"}`}>
        {children}
      </div>
    </div>
  );

  const Chip = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="text-xs sm:text-sm bg-white border border-[#F0CCD9] hover:bg-[#FFF4F8] hover:border-primary text-[#3A2430] rounded-full px-3.5 py-1.5 transition shadow-sm">
      {children}
    </button>
  );

  const panel = (
    <div dir="rtl" className="flex flex-col h-full bg-gradient-to-b from-[#FFF8F4] via-[#FCEEF3] to-[#F8DCE5]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/60 bg-white/40 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] flex items-center justify-center text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display font-bold text-[#3A2430] text-sm">Beauty Match Assistant</div>
            <div className="text-[10px] text-[#3A2430]/60">اختاري روتينك مع The Girl House</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {step !== "intro" && (
            <button onClick={reset} aria-label="إعادة" className="p-1.5 rounded-full hover:bg-white/70 text-[#3A2430]"><RotateCcw className="h-4 w-4" /></button>
          )}
          {!embedded && (
            <button onClick={() => setOpen(false)} aria-label="إغلاق" className="p-1.5 rounded-full hover:bg-white/70 text-[#3A2430]"><X className="h-4 w-4" /></button>
          )}
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4">
        <Bubble>
          أهلاً بيكي في The Girl House 💗<br />
          جاوبي على كام سؤال بسيط، وأنا أرشح لكِ أنسب منتجات من اختياراتنا الألمانية المتاحة.
        </Bubble>

        {step === "intro" && (
          <div className="flex justify-start mb-3">
            <button onClick={() => setStep("goal")} className="bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-medium shadow-soft hover:opacity-90">
              يلا نبدأ
            </button>
          </div>
        )}

        {step !== "intro" && (
          <>
            <Bubble>إيه هدفك الأساسي؟</Bubble>
            <div className="flex flex-wrap gap-2 mb-3">
              {GOALS.map((g) => (
                <Chip key={g.id} onClick={() => { setGoal(g.id); setStep("size"); }}>{g.label}</Chip>
              ))}
            </div>
            {goal && <Bubble side="user">{goalDef?.label}</Bubble>}
          </>
        )}

        {(step === "size" || step === "describe" || step === "result") && goal && (
          <>
            <Bubble>تحبي الترشيح يكون إزاي؟</Bubble>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { id: "single", label: "اختيار واحد أساسي" },
                { id: "duo", label: "روتين بسيط من منتجين" },
                { id: "full", label: "روتين كامل" },
              ].map((s) => (
                <Chip key={s.id} onClick={() => { setSize(s.id as RoutineSize); setStep("describe"); }}>{s.label}</Chip>
              ))}
            </div>
            {size && <Bubble side="user">{size === "single" ? "اختيار واحد" : size === "duo" ? "روتين بسيط" : "روتين كامل"}</Bubble>}
          </>
        )}

        {(step === "describe" || step === "result") && goalDef && (
          <>
            <Bubble>{goalDef.type === "hair" ? "إيه أكثر وصف لشعرك؟" : "إيه أكثر وصف لبشرتك؟"}</Bubble>
            <div className="flex flex-wrap gap-2 mb-3">
              {(goalDef.type === "hair" ? HAIR_DESC : SKIN_DESC).map((d) => (
                <Chip key={d} onClick={() => { setDescribe(d); setStep("result"); }}>{d}</Chip>
              ))}
            </div>
          </>
        )}

        {step === "result" && goalDef && recommended.length > 0 && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-white/80 shadow-soft mt-2">
            <div className="text-xs text-[#D96C9D] font-bold uppercase tracking-wider">روتين مقترح لكِ</div>
            <h4 className="font-display text-lg font-bold text-[#3A2430] mt-1">{goalDef.routineName}</h4>
            <p className="text-xs text-[#3A2430]/70 mt-1 leading-relaxed">{goalDef.intro}</p>

            <ul className="mt-3 space-y-2">
              {recommended.map((p: any) => (
                <li key={p.id} className="flex items-center gap-3 bg-white rounded-xl p-2 border border-[#F4DCE6]">
                  <img src={(p.images?.[0]) ?? placeholderImg} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <Link to="/product/$slug" params={{ slug: p.slug }} className="block text-sm font-semibold text-[#3A2430] truncate hover:text-primary">
                      {p.arabic_title || p.name}
                    </Link>
                    <div className="text-xs text-primary font-bold">{formatEGP(Number(p.price))}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#3A2430]/70">الإجمالي</span>
              <span className="font-bold text-primary">{formatEGP(total)}</span>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-3">
              <button onClick={addRoutineToCart} className="bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90">
                <ShoppingBag className="h-4 w-4" /> أضيفي الروتين للسلة
              </button>
              <div className={`grid ${brand.whatsapp ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                <Link to="/shop" className="bg-white border border-[#F0CCD9] text-[#3A2430] rounded-full py-2 text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-[#FFF4F8]">
                  شاهدي المنتجات <ArrowRight className="h-3 w-3" />
                </Link>
                {brand.whatsapp && (
                  <a href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white rounded-full py-2 text-xs font-medium inline-flex items-center justify-center gap-1">
                    اسألي على واتساب
                  </a>
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#3A2430]/55 mt-3 text-center leading-relaxed">
              هذه التوصيات للعناية التجميلية فقط وليست نصيحة طبية.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="rounded-3xl overflow-hidden border border-white/70 shadow-[0_30px_60px_-30px_rgba(217,108,157,0.35)] h-[640px] max-h-[80vh]">
        {panel}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="افتحي مساعدة الجمال"
        className="fixed bottom-24 sm:bottom-6 left-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-[#D96C9D] to-[#E7A8BF] text-white shadow-[0_15px_40px_-10px_rgba(217,108,157,0.7)] flex items-center justify-center hover:scale-105 transition motion-reduce:transform-none"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 sm:bottom-24 left-4 sm:left-6 z-50 w-[92vw] sm:w-[400px] h-[600px] max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-white/70"
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
