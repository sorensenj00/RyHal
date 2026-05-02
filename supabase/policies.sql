-- Policies

-- Storage: association-logo bucket
CREATE POLICY "Allow uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'association-logo');

CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'association-logo');

CREATE POLICY "Allow updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'association-logo');