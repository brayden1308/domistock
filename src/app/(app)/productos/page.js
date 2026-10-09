"use client";
import { useEffect, useState } from "react";
import { Plus, ArrowDownToLine, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
const vacio = { nombre: "", precio_compra: "", precio_venta: "", stock: "", stock_minimo: 5 };
const money = (n) => "$" + Number(n).toLocaleString("es-CO");
export default function Productos() {
  const [lista, setLista] = useState([]);
  const [f, setF] = useState(vacio);
  const cargar = async () => {
    const { data } = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
    setLista(data || []);
  };
  useEffect(() => { cargar(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function guardar(e) { e.preventDefault(); await supabase.from("productos").insert(f); setF(vacio); cargar(); }
  async function quitar(id) { await supabase.from("productos").update({ activo: false }).eq("id", id); cargar(); }
  async function reponer(p) {
    const n = Number(prompt(`Unidades que entran de ${p.nombre}:`));
    if (n > 0) { await supabase.from("productos").update({ stock: p.stock + n }).eq("id", p.id); cargar(); }
  }
  const campos = [["nombre", "Nombre", "text", "Arroz 500g"], ["precio_compra", "Precio compra", "number", "3000"], ["precio_venta", "Precio venta", "number", "4500"], ["stock", "Stock", "number", "20"], ["stock_minimo", "Stock mínimo", "number", "5"]];
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Productos</h1><p style={{ color: "var(--muted)" }}>{lista.length} productos en tu inventario</p></div>
      <form onSubmit={guardar} className="card grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        {campos.map(([k, l, t, ph]) => (
          <div key={k} className={k === "nombre" ? "sm:col-span-3 lg:col-span-1" : ""}>
            <label className="label">{l}</label>
            <input className="input" type={t} placeholder={ph} value={f[k]} onChange={set(k)} required={k !== "precio_compra" && k !== "stock_minimo"} />
          </div>
        ))}
        <button className="btn"><Plus size={18} />Agregar</button>
      </form>
      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="border-b" style={{ borderColor: "var(--line)" }}>
            <th className="th p-4">Producto</th><th className="th">Precio</th><th className="th">Stock</th><th className="th text-right pr-4">Acciones</th>
          </tr></thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                <td className="p-4"><div className="flex items-center gap-3"><div className="avatar">{p.nombre[0]?.toUpperCase()}</div><span className="font-semibold">{p.nombre}</span></div></td>
                <td className="font-semibold">{money(p.precio_venta)}</td>
                <td><span className={"badge " + (p.stock === 0 ? "b-out" : p.stock <= p.stock_minimo ? "b-low" : "b-ok")}>{p.stock} uds</span></td>
                <td className="text-right pr-4 whitespace-nowrap">
                  <button className="btn btn-ghost !py-1.5 mr-2" onClick={() => reponer(p)}><ArrowDownToLine size={16} />Entrada</button>
                  <button className="btn btn-ghost !py-1.5" style={{ color: "#b3261e" }} onClick={() => quitar(p.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={4} className="p-8 text-center" style={{ color: "var(--muted)" }}>Aún no tienes productos. Agrega el primero arriba.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
