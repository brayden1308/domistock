"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Minus, MessageCircle, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
const money = (n) => "$" + Number(n).toLocaleString("es-CO");
export default function Tienda() {
  const { slug } = useParams();
  const [neg, setNeg] = useState(null);
  const [prods, setProds] = useState([]);
  const [cart, setCart] = useState({});
  useEffect(() => {
    (async () => {
      const { data: n } = await supabase.from("negocios").select("*").eq("slug", slug).single();
      setNeg(n);
      if (n) {
        const { data } = await supabase.from("productos").select("*").eq("negocio_id", n.id).eq("activo", true).gt("stock", 0).order("nombre");
        setProds(data || []);
      }
    })();
  }, [slug]);
  if (!neg) return <p className="p-8" style={{ color: "var(--muted)" }}>Cargando tienda...</p>;
  const cambiar = (p, d) => setCart((c) => ({ ...c, [p.id]: Math.max(0, Math.min((c[p.id] || 0) + d, p.stock)) }));
  const items = prods.filter((p) => cart[p.id]);
  const total = items.reduce((s, p) => s + cart[p.id] * p.precio_venta, 0);
  const unidades = items.reduce((s, p) => s + cart[p.id], 0);
  const texto = `Hola ${neg.nombre}, quiero pedir:\n` + items.map((p) => `- ${cart[p.id]} x ${p.nombre}`).join("\n") + `\nTotal: ${money(total)}`;
  return (
    <main className="min-h-screen pb-28">
      <header className="text-white px-6 py-12 text-center" style={{ background: "var(--forest)" }}>
        <div className="avatar mx-auto mb-3" style={{ background: "var(--lime)" }}><Store size={20} /></div>
        <h1 className="text-3xl font-extrabold">{neg.nombre}</h1>
        <p className="opacity-80 mt-1">Arma tu pedido y envíalo por WhatsApp</p>
      </header>
      <div className="max-w-4xl mx-auto p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
        {prods.map((p) => (
          <div key={p.id} className="card flex flex-col">
            <div className="avatar mb-3">{p.nombre[0]?.toUpperCase()}</div>
            <p className="font-bold leading-tight">{p.nombre}</p>
            <p className="font-extrabold mt-1" style={{ color: "var(--forest)" }}>{money(p.precio_venta)}</p>
            <div className="flex items-center justify-between mt-auto pt-3">
              <button className="btn btn-ghost !p-1.5" onClick={() => cambiar(p, -1)}><Minus size={14} /></button>
              <b>{cart[p.id] || 0}</b>
              <button className="btn !p-1.5" onClick={() => cambiar(p, 1)}><Plus size={14} /></button>
            </div>
          </div>
        ))}
        {prods.length === 0 && <p style={{ color: "var(--muted)" }}>Esta tienda aún no tiene productos disponibles.</p>}
      </div>
      {total > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t" style={{ borderColor: "var(--line)" }}>
          <a className="btn btn-lime w-full max-w-4xl mx-auto !py-3.5 text-lg" target="_blank" href={`https://wa.me/${neg.whatsapp}?text=${encodeURIComponent(texto)}`}>
            <MessageCircle size={20} />Pedir por WhatsApp · {unidades} uds · {money(total)}
          </a>
        </div>
      )}
    </main>
  );
}
