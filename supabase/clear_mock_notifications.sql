-- clear_mock_notifications.sql
-- Clear existing mock notifications to prepare for live data

DELETE FROM public.notifications;
-- Optionally reset identity if it's a serial ID
-- ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
