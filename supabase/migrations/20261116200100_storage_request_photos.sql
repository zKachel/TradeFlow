-- =====================================================================
-- TradeFlow – privater Speicher für Anfrage-Fotos (Sprint 2)
-- Pfadschema: <user_id>/<request_id>/<datei>.<ext>
-- * Bucket ist privat (public = false). Anzeige nur über kurzlebige signierte URLs.
-- * Größen- und Typlimit wird zusätzlich vom Storage-Dienst selbst erzwungen.
-- * Hochladen und Lesen nur für den Eigentümer der Anfrage.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create function private.owns_request_path(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    (storage.foldername(p_name))[1] = auth.uid()::text
    and (storage.foldername(p_name))[2] ~ '^[0-9a-f-]{36}$'
    and exists (
      select 1 from public.customer_requests r
      where r.id = ((storage.foldername(p_name))[2])::uuid
        and r.customer_id = auth.uid()
    )
$$;
grant execute on function private.owns_request_path(text) to authenticated;

create policy "request_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'request-photos' and private.owns_request_path(name));

create policy "request_photos_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'request-photos' and private.owns_request_path(name));

-- Kein update/delete-Policy: Fotos können in Sprint 2 nicht überschrieben oder gelöscht werden.
