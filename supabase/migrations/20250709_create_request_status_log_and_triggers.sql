-- Migration: Create request_status_log table, add status column, and set up status change trigger

-- 1. Create request_status_log table
CREATE TABLE IF NOT EXISTS public.request_status_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_by text,
    changed_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add status column to requests if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='requests' AND column_name='status'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN status text;
    END IF;
END$$;

-- 3. Create trigger function for status changes
CREATE OR REPLACE FUNCTION public.log_request_status_change() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO public.request_status_log (request_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, current_user);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on requests for status changes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_request_status_change'
    ) THEN
        CREATE TRIGGER trg_log_request_status_change
        AFTER UPDATE OF status ON public.requests
        FOR EACH ROW
        EXECUTE FUNCTION public.log_request_status_change();
    END IF;
END$$; 