"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, ShoppingCart, MessageCircle, BellRing } from "lucide-react";
import { supabase } from "@/lib/supabase";
export default function Login() {
  const r = useRouter();
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ email: "", password: "", nombre: "", whatsapp: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setErr("");
    if (reg) {
      const { error } = await supabase.auth.signUp({ email: f.email, password: f.password });
      if (error) return setErr(error.message);
      const slug = f.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error: e2 } = await supabase.rpc("crear_negocio", { p_nombre: f.nombre, p_slug: slug, p_whatsapp: f.whatsapp });
      if (e2) return setErr(e2.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) return setErr(error.message);
    }
    r.push("/dashboard");
  }
  const feats = [[ShoppingCart, "Vende y descuenta stock solo"], [BellRing, "Alertas de productos por agotarse"], [MessageCircle, "Catálogo con pedidos por WhatsApp"]];
  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <section className="hidden md:flex flex-col justify-between p-12 text-white" style={{ background: "var(--forest)" }}>
        <div className="flex items-center gap-2 text-xl font-extrabold"><Boxes /> DomiStock</div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">Tu tienda organizada,<br />en tu celular.</h1>
          <ul className="mt-8 space-y-4">
            {feats.map(([I, t]) => (
              <li key={t} className="flex items-center gap-3"><span className="avatar"><I size={18} /></span>{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-70">Inventario y ventas para tiendas de barrio</p>
      </section>
      <section className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="md:hidden flex items-center gap-2 text-xl font-extrabold" style={{ color: "var(--forest)" }}><Boxes /> DomiStock</div>
          <div>
            <h2 className="text-2xl font-extrabold">{reg ? "Crea tu tienda" : "Bienvenido de nuevo"}</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{reg ? "Empieza gratis en menos de un minuto" : "Ingresa para administrar tu negocio"}</p>
          </div>
          {reg && <div><label className="label">Nombre de la tienda</label><input className="input" placeholder="Tienda Don José" value={f.nombre} onChange={set("nombre")} required /></div>}
          {reg && <div><label className="label">WhatsApp</label><input className="input" placeholder="573001234567" value={f.whatsapp} onChange={set("whatsapp")} required /></div>}
          <div><label className="label">Correo</label><input className="input" type="email" placeholder="tu@correo.com" value={f.email} onChange={set("email")} required /></div>
          <div><label className="label">Contraseña</label><input className="input" type="password" placeholder="Mínimo 6 caracteres" value={f.password} onChange={set("password")} required /></div>
          {err && <p className="text-sm rounded-lg p-3 b-out">{err}</p>}
          <button className="btn w-full">{reg ? "Crear mi tienda" : "Entrar"}</button>
          <button type="button" onClick={() => setReg(!reg)} className="w-full text-sm font-semibold" style={{ color: "var(--forest)" }}>
            {reg ? "Ya tengo cuenta, entrar" : "¿Eres nuevo? Registra tu tienda"}
          </button>
        </form>
      </section>
    </main>
  );
}
