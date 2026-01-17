import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mdfpupnpftmkhyryozro.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZnB1cG5wZnRta2h5cnlvenJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTg2NjksImV4cCI6MjA4NDE5NDY2OX0.P7kLI51Q-JAjlppV6DYEiYIsJ1uh6I1KqHcB98W95tI'
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('ai_tools')
    .select('*')
    .limit(0);
  
  console.log('Error:', error);
  console.log('If table exists but is empty, error will be null');
}

checkSchema();
