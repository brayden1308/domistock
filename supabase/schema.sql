create table negocios (id uuid primary key default gen_random_uuid(), nombre text not null, slug text unique not null, whatsapp text, created_at timestamptz default now());
create table perfiles (id uuid primary key references auth.users on delete cascade, negocio_id uuid references negocios on delete cascade, nombre text, rol text default 'admin');

create function mi_negocio() returns uuid language sql stable security definer set search_path = public as
$$ select negocio_id from perfiles where id = auth.uid() $$;

create table productos (id uuid primary key default gen_random_uuid(), negocio_id uuid not null default mi_negocio() references negocios on delete cascade,
  nombre text not null, precio_compra numeric default 0, precio_venta numeric not null, stock int not null default 0 check (stock >= 0), stock_minimo int default 5, activo boolean default true, created_at timestamptz default now());
create table ventas (id uuid primary key default gen_random_uuid(), negocio_id uuid not null default mi_negocio() references negocios on delete cascade,
  usuario_id uuid default auth.uid(), total numeric not null, metodo_pago text default 'efectivo', fecha timestamptz default now());
create table venta_items (id uuid primary key default gen_random_uuid(), negocio_id uuid not null default mi_negocio() references negocios on delete cascade,
  venta_id uuid references ventas on delete cascade, producto_id uuid references productos, cantidad int not null, precio_unitario numeric not null);

-- Descuento automatico de stock
create function descontar_stock() returns trigger language plpgsql security definer set search_path = public as
$$ begin update productos set stock = stock - new.cantidad where id = new.producto_id; return new; end $$;
create trigger trg_descontar after insert on venta_items for each row execute function descontar_stock();

-- Registro: crea negocio + perfil admin
create function crear_negocio(p_nombre text, p_slug text, p_whatsapp text) returns void language plpgsql security definer set search_path = public as
$$ declare nid uuid; begin
  insert into negocios(nombre, slug, whatsapp) values (p_nombre, p_slug, p_whatsapp) returning id into nid;
  insert into perfiles(id, negocio_id, nombre, rol) values (auth.uid(), nid, p_nombre, 'admin'); end $$;

-- Seguridad (RLS)
alter table negocios enable row level security; alter table perfiles enable row level security; alter table productos enable row level security;
alter table ventas enable row level security; alter table venta_items enable row level security;
create policy "negocios publico" on negocios for select using (true);
create policy "perfil propio" on perfiles for select using (id = auth.uid());
create policy "productos negocio" on productos for all using (negocio_id = mi_negocio()) with check (negocio_id = mi_negocio());
create policy "productos catalogo" on productos for select using (activo and stock > 0);
create policy "ventas negocio" on ventas for all using (negocio_id = mi_negocio()) with check (negocio_id = mi_negocio());
create policy "items negocio" on venta_items for all using (negocio_id = mi_negocio()) with check (negocio_id = mi_negocio());
