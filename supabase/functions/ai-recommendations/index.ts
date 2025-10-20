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
    const { entityType, entityId, context } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert GRC advisor providing explainable AI recommendations.
For each recommendation, provide:
1. Clear, actionable title
2. Detailed description
3. Transparent rationale explaining WHY this is recommended
4. Confidence score (0.00 to 1.00)
5. Priority level
Return ONLY valid JSON array: [{"recommendation_type": "risk_mitigation", "title": "...", "description": "...", "rationale": "...", "confidence_score": 0.90, "priority": "high"}]`;

    const userPrompt = `Entity Type: ${entityType}
Entity ID: ${entityId}
Context: ${JSON.stringify(context)}

Generate 2-4 explainable recommendations for improving risk management, compliance, or governance.`;

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
    let recommendations = data.choices[0].message.content;
    
    const jsonMatch = recommendations.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      recommendations = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid AI response format');
    }

    // Insert recommendations
    const recsToInsert = recommendations.map((r: any) => ({
      ...r,
      entity_type: entityType,
      entity_id: entityId,
    }));

    const { error: insertError } = await supabase
      .from('ai_recommendations')
      .insert(recsToInsert);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, recommendations: recsToInsert }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
