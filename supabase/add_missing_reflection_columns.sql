-- Migration to add V11 Readiness metrics to reflections table
ALTER TABLE reflections 
ADD COLUMN IF NOT EXISTS soreness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sleep_quality INTEGER DEFAULT 0;

-- Optional: Add comments to these columns for clarity
COMMENT ON COLUMN reflections.soreness IS 'Self-reported body soreness level (1-10)';
COMMENT ON COLUMN reflections.sleep_quality IS 'Self-reported sleep quality (1-10)';
