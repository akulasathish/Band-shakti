alter table "public"."tickets" add column "pax" integer default 1;


  create policy "Public Selects"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'gallery'::text));



  create policy "Public Uploads"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'gallery'::text));



