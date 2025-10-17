-- Add foreign key to documents table linking to profiles
ALTER TABLE public.documents
ADD CONSTRAINT documents_uploaded_by_fkey
FOREIGN KEY (uploaded_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;