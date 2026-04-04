-- Function to update session counts
CREATE OR REPLACE FUNCTION public.update_roster_session_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update for INSERT or UPDATE
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.roster_uploads
        SET 
            session_count = (SELECT count(*) FROM public.sessions WHERE roster_id = NEW.roster_id),
            lesson_count = (SELECT count(*) FROM public.sessions WHERE roster_id = NEW.roster_id AND lesson_number > 0)
        WHERE id = NEW.roster_id;
    END IF;

    -- Update for DELETE or UPDATE (old record)
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        UPDATE public.roster_uploads
        SET 
            session_count = (SELECT count(*) FROM public.sessions WHERE roster_id = OLD.roster_id),
            lesson_count = (SELECT count(*) FROM public.sessions WHERE roster_id = OLD.roster_id AND lesson_number > 0)
        WHERE id = OLD.roster_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_session_change_update_counts ON public.sessions;
CREATE TRIGGER on_session_change_update_counts
AFTER INSERT OR UPDATE OR DELETE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_roster_session_counts();
