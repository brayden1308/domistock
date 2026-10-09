"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Store, LogOut, Boxes } from "lucide-react";
import { supabase } from "@/lib/supabase";
const items = [["/dashboard", "Dashboard", LayoutDashboard], ["/productos", "Productos", Package], ["/ventas", "Ventas", ShoppingCart]];
export default function AppLayout({ children }) {
  const r = useRouter();
  const path = usePathname();
  const [neg, setNeg] = useState(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return r.push("/login");
      const { data } = await supabase.from("perfiles").select("negocios(nombre,slug)").eq("id", user.id).single();
      setNeg(data?.negocios);
    })();
  }, []);
  if (!neg) return <p className="p-8" style={{ color: "var(--muted)" }}>Cargando...</p>;
  const salir = async () => { await supabase.auth.signOut(); r.push("/login"); };
  const link = (active) => "flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition " + (active ? "bg-[var(--lime)] text-[var(--ink)]" : "text-white/80 hover:bg-white/10");
  return (
    <div className="min-h-screen">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col p-5 text-white" style={{ background: "var(--forest)" }}>
        <div className="flex items-center gap-2 text-xl font-extrabold mb-1"><Boxes /> DomiStock</div>
        <p className="text-sm opacity-70 mb-8 truncate">{neg.nombre}</p>
        <nav className="space-y-1 flex-1">
          {items.map(([h, t, I]) => <Link key={h} href={h} className={link(path === h)}><I size={18} />{t}</Link>)}
          <Link href={`/tienda/${neg.slug}`} target="_blank" className={link(false)}><Store size={18} />Mi catálogo</Link>
        </nav>
        <button onClick={salir} className={link(false)}><LogOut size={18} />Salir</button>
      </aside>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex justify-around bg-white border-t py-2" style={{ borderColor: "var(--line)" }}>
        {items.map(([h, t, I]) => (
          <Link key={h} href={h} className="flex flex-col items-center text-xs font-semibold" style={{ color: path === h ? "var(--forest)" : "var(--muted)" }}><I size={20} />{t}</Link>
        ))}
        <Link href={`/tienda/${neg.slug}`} target="_blank" className="flex flex-col items-center text-xs font-semibold" style={{ color: "var(--muted)" }}><Store size={20} />Catálogo</Link>
        <button onClick={salir} className="flex flex-col items-center text-xs font-semibold" style={{ color: "var(--muted)" }}><LogOut size={20} />Salir</button>
      </nav>
      <main className="md:ml-64 p-5 md:p-8 pb-24 md:pb-8 max-w-6xl">{children}</main>
    </div>
  );
}
