import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mdfpupnpftmkhyryozro.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZnB1cG5wZnRta2h5cnlvenJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MTg2NjksImV4cCI6MjA4NDE5NDY2OX0.P7kLI51Q-JAjlppV6DYEiYIsJ1uh6I1KqHcB98W95tI'
);

async function getColumns() {
  // Try to get information from information_schema
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ai_tools' ORDER BY ordinal_position;`
  });
  
  if (error) {
    console.log('RPC not available, trying insert to see column error...');
    
    // Try a simple insert to see what columns are required
    const { error: insertError } = await supabase
      .from('ai_tools')
      .insert({
        name: 'Test',
        category: 'productivity',
        pricing_model: 'free'
      });
    
    console.log('Insert error:', insertError);
  } else {
    console.log('Columns:', data);
  }
}

getColumns();
