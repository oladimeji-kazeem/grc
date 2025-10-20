import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch current compliance data
    const { data: compliance } = await supabase
      .from('compliance_requirements')
      .select('*');

    const { data: risks } = await supabase
      .from('risks')
      .select('*');

    const { data: incidents } = await supabase
      .from('incidents')
      .select('*');

    const systemPrompt = `You are a predictive compliance analyst. Analyze historical data to predict future compliance issues.
Generate alerts for potential compliance violations based on patterns, trends, and risk indicators.
Return ONLY valid JSON array: [{"alert_type": "compliance_deadline", "severity": "high", "title": "...", "description": "...", "entity_type": "compliance", "entity_id": "uuid", "predicted_date": "2024-12-31", "confidence_score": 0.85}]`;

    const userPrompt = `Analyze this data and predict potential compliance issues:

Compliance Requirements: ${JSON.stringify(compliance?.slice(0, 20))}
Risks: ${JSON.stringify(risks?.slice(0, 20))}
Recent Incidents: ${JSON.stringify(incidents?.slice(0, 10))}

Generate 3-5 predictive alerts for upcoming compliance issues within the next 90 days.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    let alerts = data.choices[0].message.content;
    
    const jsonMatch = alerts.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      alerts = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid AI response format');
    }

    // Insert alerts
    const { error: insertError } = await supabase
      .from('predictive_alerts')
      .insert(alerts);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-predictions:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
