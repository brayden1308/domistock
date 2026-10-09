"use client";
import { useEffect, useState } from "react";
import { Plus, Minus, ShoppingBag, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
const money = (n) => "$" + Number(n).toLocaleString("es-CO");
export default function Ventas() {
  const [prods, setProds] = useState([]);
  const [cart, setCart] = useState({});
  const [pago, setPago] = useState("efectivo");
  const [msg, setMsg] = useState("");
  const [hist, setHist] = useState([]);
  const [abierta, setAbierta] = useState(null);

  const cargar = async () => {
    const { data } = await supabase.from("productos").select("*").eq("activo", true).gt("stock", 0).order("nombre");
    setProds(data || []);
    const { data: h } = await supabase
      .from("ventas")
      .select("id,total,metodo_pago,fecha,venta_items(cantidad,precio_unitario,productos(nombre))")
      .order("fecha", { ascending: false })
      .limit(20);
    setHist(h || []);
  };
  useEffect(() => { cargar(); }, []);

  const qty = (p) => Number(cart[p.id]) || 0;
  const quitar = (p) => setCart((c) => { const n = { ...c }; delete n[p.id]; return n; });
  // Cantidad editable: acepta vacío mientras se escribe y limita al stock
  const fijar = (p, v) => setCart((c) => {
    if (v === "") return { ...c, [p.id]: "" };
    const n = Math.max(0, Math.min(parseInt(v, 10) || 0, p.stock));
    return { ...c, [p.id]: n };
  });
  const sumar = (p, d) => { const n = qty(p) + d; n <= 0 ? quitar(p) : fijar(p, n); };

  const items = prods.filter((p) => p.id in cart);
  const validos = items.filter((p) => qty(p) > 0);
  const total = validos.reduce((s, p) => s + qty(p) * p.precio_venta, 0);

  async function cobrar() {
    if (!validos.length) return;
    const { data: v, error } = await supabase.from("ventas").insert({ total, metodo_pago: pago }).select().single();
    if (error) return setMsg(error.message);
    const rows = validos.map((p) => ({ venta_id: v.id, producto_id: p.id, cantidad: qty(p), precio_unitario: p.precio_venta }));
    const { error: e2 } = await supabase.from("venta_items").insert(rows);
    setMsg(e2 ? e2.message : "Venta registrada ✔");
    setCart({}); cargar();
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div><h1 className="text-3xl font-extrabold">Nueva venta</h1><p style={{ color: "var(--muted)" }}>Toca un producto o escribe la cantidad en el carrito</p></div>
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {prods.map((p) => (
              <button key={p.id} onClick={() => sumar(p, 1)} className="card text-left transition hover:-translate-y-0.5 hover:shadow-md relative">
                {qty(p) > 0 && <span className="badge absolute top-3 right-3" style={{ background: "var(--forest)", color: "#fff" }}>{qty(p)}</span>}
                <div className="avatar mb-3">{p.nombre[0]?.toUpperCase()}</div>
                <p className="font-bold leading-tight">{p.nombre}</p>
                <p className="font-extrabold mt-1" style={{ color: "var(--forest)" }}>{money(p.precio_venta)}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Stock: {p.stock}</p>
              </button>
            ))}
            {prods.length === 0 && <p style={{ color: "var(--muted)" }}>No hay productos con stock disponible.</p>}
          </div>
          <div className="card lg:sticky lg:top-6 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><ShoppingBag size={18} />Venta actual</h2>
            {items.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>El carrito está vacío.</p>}
            {items.map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-semibold truncate">{p.nombre}</p><p className="text-xs" style={{ color: "var(--muted)" }}>{money(qty(p) * p.precio_venta)} · máx. {p.stock}</p></div>
                  <button onClick={() => quitar(p)} style={{ color: "var(--muted)" }}><X size={16} /></button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost !p-2" onClick={() => sumar(p, -1)}><Minus size={14} /></button>
                  <input
                    className="input !py-1.5 text-center font-bold"
                    type="number" inputMode="numeric" min="1" max={p.stock}
                    value={cart[p.id]}
                    onChange={(e) => fijar(p, e.target.value)}
                    onBlur={() => { if (!qty(p)) quitar(p); }}
                  />
                  <button className="btn btn-ghost !p-2" onClick={() => sumar(p, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}
            <div className="border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between items-baseline"><span className="label">Total</span><span className="text-3xl font-extrabold">{money(total)}</span></div>
            </div>
            <div><label className="label">Método de pago</label>
              <select className="input" value={pago} onChange={(e) => setPago(e.target.value)}>
                <option value="efectivo">Efectivo</option><option value="nequi">Nequi</option><option value="transferencia">Transferencia</option>
              </select>
            </div>
            <button disabled={!total} onClick={cobrar} className="btn btn-lime w-full !py-3 text-lg">Cobrar</button>
            {items.length > 0 && <button onClick={() => setCart({})} className="w-full text-sm" style={{ color: "var(--muted)" }}>Vaciar carrito</button>}
            {msg && <p className="text-sm font-semibold text-center">{msg}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div><h2 className="text-2xl font-extrabold">Historial de ventas</h2><p style={{ color: "var(--muted)" }}>Últimas 20 ventas, toca una para ver el desglose</p></div>
        <div className="space-y-3">
          {hist.length === 0 && <p style={{ color: "var(--muted)" }}>Aún no has registrado ventas.</p>}
          {hist.map((v) => (
            <div key={v.id} className="card !p-0 overflow-hidden">
              <button onClick={() => setAbierta(abierta === v.id ? null : v.id)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <div>
                  <p className="font-bold">{new Date(v.fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{v.venta_items.length} producto(s) · <span className="capitalize">{v.metodo_pago}</span></p>
                </div>
                <div className="flex items-center gap-3"><span className="text-xl font-extrabold">{money(v.total)}</span>{abierta === v.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
              </button>
              {abierta === v.id && (
                <div className="border-t px-4 pb-4 overflow-x-auto" style={{ borderColor: "var(--line)" }}>
                  <table className="w-full text-left mt-3">
                    <thead><tr><th className="th pb-2">Producto</th><th className="th text-right">Cant.</th><th className="th text-right">Precio</th><th className="th text-right">Subtotal</th></tr></thead>
                    <tbody>
                      {v.venta_items.map((i, k) => (
                        <tr key={k}>
                          <td className="py-1 font-semibold">{i.productos?.nombre || "Producto eliminado"}</td>
                          <td className="text-right">{i.cantidad}</td>
                          <td className="text-right">{money(i.precio_unitario)}</td>
                          <td className="text-right font-bold">{money(i.cantidad * i.precio_unitario)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
