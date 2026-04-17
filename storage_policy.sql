-- 1. Asegurarnos que el bucket "products" existe y es 100% público
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. Permitir que cualquier persona pueda VER o DESCARGAR imágenes desde el bucket
create policy "Allow public READ" 
on storage.objects for select 
using ( bucket_id = 'products' );

-- 3. Permitir que nuestra aplicación en Vercel (o localhost) pueda SUBIR imágenes libremente
create policy "Allow public INSERT" 
on storage.objects for insert 
with check ( bucket_id = 'products' );

-- 4. Permitir actualizar si es necesario reemplazar la foto en la edición
create policy "Allow public UPDATE" 
on storage.objects for update 
using ( bucket_id = 'products' );
