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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { policyId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch policy details
    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (policyError) throw policyError;

    // Fetch all compliance requirements
    const { data: requirements, error: reqError } = await supabase
      .from('compliance_requirements')
      .select('*');

    if (reqError) throw reqError;

    const systemPrompt = `You are an expert compliance analyst. Map the given policy to relevant compliance requirements.
For each match, provide:
1. confidence_score (0.00 to 1.00)
2. rationale (brief explanation)
Return ONLY valid JSON array format: [{"requirement_id": "uuid", "confidence_score": 0.95, "rationale": "explanation"}]`;

    const userPrompt = `Policy:
Title: ${policy.title}
Description: ${policy.description}
Category: ${policy.category}

Available Compliance Requirements:
${requirements.map(r => `ID: ${r.id}\nCode: ${r.requirement_code}\nTitle: ${r.title}\nSource: ${r.source}\nCategory: ${r.category}\n`).join('\n')}

Map this policy to the most relevant requirements with confidence scores.`;

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
    let mappings = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = mappings.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      mappings = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid AI response format');
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    // Insert mappings
    const mappingsToInsert = mappings.map((m: any) => ({
      policy_id: policyId,
      requirement_id: m.requirement_id,
      mapping_confidence: m.confidence_score,
      mapping_rationale: m.rationale,
      mapped_by: user?.id,
    }));

    const { error: insertError } = await supabase
      .from('regulation_mappings')
      .insert(mappingsToInsert);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, mappings: mappingsToInsert }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in auto-map-regulations:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
