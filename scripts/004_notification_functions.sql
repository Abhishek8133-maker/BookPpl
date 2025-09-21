-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to notify users when a new request matches their skills
CREATE OR REPLACE FUNCTION public.notify_matching_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  matching_user RECORD;
BEGIN
  -- Only notify for new open requests
  IF NEW.status = 'open' AND (TG_OP = 'INSERT' OR OLD.status != 'open') THEN
    -- Find users with matching skills who are available
    FOR matching_user IN
      SELECT DISTINCT p.id, p.display_name
      FROM public.profiles p
      JOIN public.user_skills us ON p.id = us.user_id
      JOIN public.skills s ON us.skill_id = s.id
      WHERE s.name = NEW.skill_needed
        AND p.is_available = true
        AND p.id != NEW.requester_id
    LOOP
      -- Create notification for each matching user
      PERFORM public.create_notification(
        matching_user.id,
        'new_request',
        'New Request Matches Your Skills!',
        'A new request for "' || NEW.skill_needed || '" has been posted: ' || NEW.title,
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to notify when booking status changes
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_title TEXT;
  requester_name TEXT;
  helper_name TEXT;
BEGIN
  -- Get request and user details
  SELECT r.title, rp.display_name, hp.display_name
  INTO request_title, requester_name, helper_name
  FROM public.requests r
  JOIN public.profiles rp ON r.requester_id = rp.id
  JOIN public.profiles hp ON NEW.helper_id = hp.id
  WHERE r.id = NEW.request_id;
  
  -- Notify based on status change
  IF TG_OP = 'INSERT' THEN
    -- New booking application - notify requester
    PERFORM public.create_notification(
      NEW.requester_id,
      'booking_request',
      'New Application Received',
      helper_name || ' has applied to help with "' || request_title || '"',
      NEW.id
    );
  ELSIF OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      -- Booking accepted - notify helper
      PERFORM public.create_notification(
        NEW.helper_id,
        'booking_accepted',
        'Application Accepted!',
        requester_name || ' has accepted your application for "' || request_title || '"',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      -- Booking declined - notify helper
      PERFORM public.create_notification(
        NEW.helper_id,
        'booking_declined',
        'Application Update',
        'Your application for "' || request_title || '" was not selected this time',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS notify_matching_users_trigger ON public.requests;
CREATE TRIGGER notify_matching_users_trigger
  AFTER INSERT OR UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_matching_users();

DROP TRIGGER IF EXISTS notify_booking_status_change_trigger ON public.bookings;
CREATE TRIGGER notify_booking_status_change_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();
