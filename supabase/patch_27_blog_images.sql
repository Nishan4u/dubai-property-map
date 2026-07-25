-- Lets blog posts have a real cover image instead of only a gradient
-- placeholder. Reuses the existing project-media storage bucket under a
-- blog-images/ prefix — admin-only, since blog posts are admin-managed.

alter table blog_posts
  add column if not exists cover_image_url text;

create policy "project-media: admin manages blog images"
  on storage.objects for all
  using (bucket_id = 'project-media' and (storage.foldername(name))[1] = 'blog-images' and is_admin())
  with check (bucket_id = 'project-media' and (storage.foldername(name))[1] = 'blog-images' and is_admin());
