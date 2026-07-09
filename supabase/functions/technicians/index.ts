// Supabase Edge Function — technicians
// Usa a SERVICE ROLE KEY para bypassar o RLS da tabela "technicians".
// O frontend chama esta função com a anon key — a service key nunca é exposta.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Responde preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Cliente com Service Role Key — bypassa RLS
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase     = createClient(supabaseUrl, serviceKey);

    const method = req.method;
    let body: Record<string, unknown> = {};

    if (method !== 'GET') {
      body = await req.json().catch(() => ({}));
    }

    // ── GET — lista todos os técnicos ────────────────────────────────────────
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── POST — adiciona técnico ──────────────────────────────────────────────
    if (method === 'POST') {
      const { id, name } = body as { id: string; name: string };
      if (!id || !name) throw new Error('id e name são obrigatórios.');

      const { error } = await supabase.from('technicians').insert({ id, name });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── PUT — atualiza nome do técnico ───────────────────────────────────────
    if (method === 'PUT') {
      const { id, name } = body as { id: string; name: string };
      if (!id || !name) throw new Error('id e name são obrigatórios.');

      const { error } = await supabase
        .from('technicians')
        .update({ name })
        .eq('id', id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE — remove técnico ──────────────────────────────────────────────
    if (method === 'DELETE') {
      const { id } = body as { id: string };
      if (!id) throw new Error('id é obrigatório.');

      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Método não suportado.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
