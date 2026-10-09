"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Receipt, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
const money = (n) => "$" + Number(n).toLocaleString("es-CO");
function Stat({ icon: I, label, value, dark }) {
  return (
    <div className={"card " + (dark ? "card-dark" : "")}>
      <div className="flex items-center justify-between"><span className="label" style={dark ? { color: "#c6f36b" } : {}}>{label}</span><I size={18} style={{ opacity: 0.6 }} /></div>
      <p className="text-3xl font-extrabold mt-2">{value}</p>
    </div>
  );
}
export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [bajos, setBajos] = useState([]);
  useEffect(() => {
    (async () => {
      const desde = new Date(Date.now() - 7 * 864e5).toISOString();
      const { data: v } = await supabase.from("ventas").select("total,fecha").gte("fecha", desde);
      setVentas(v || []);
      const { data: p } = await supabase.from("productos").select("nombre,stock,stock_minimo").eq("activo", true);
      setBajos((p || []).filter((x) => x.stock <= x.stock_minimo));
    })();
  }, []);
  const hoy = new Date().toDateString();
  const deHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === hoy);
  const porDia = {};
  ventas.forEach((v) => { const d = new Date(v.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }); porDia[d] = (porDia[d] || 0) + Number(v.total); });
  const datos = Object.entries(porDia).map(([dia, total]) => ({ dia, total }));
  const suma = (a) => money(a.reduce((s, v) => s + Number(v.total), 0));
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Resumen</h1><p style={{ color: "var(--muted)" }}>Así va tu negocio esta semana</p></div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Receipt} label="Ventas hoy" value={deHoy.length} />
        <Stat icon={Wallet} label="Ingresos hoy" value={suma(deHoy)} dark />
        <Stat icon={TrendingUp} label="Últimos 7 días" value={suma(ventas)} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="font-bold mb-4">Ventas por día</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={datos}>
                <CartesianGrid vertical={false} stroke="#e5e3d8" />
                <XAxis dataKey="dia" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v) => money(v)} />
                <Bar dataKey="total" fill="#0f4d33" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18} color="#b36b00" />Por agotarse</h2>
          {bajos.length === 0 && <p style={{ color: "var(--muted)" }}>Todo en orden por ahora 🎉</p>}
          <div className="space-y-3">
            {bajos.map((p) => (
              <div key={p.nombre} className="flex items-center justify-between">
                <span className="font-semibold">{p.nombre}</span>
                <span className={"badge " + (p.stock === 0 ? "b-out" : "b-low")}>{p.stock} uds</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
