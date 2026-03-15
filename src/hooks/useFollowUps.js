import { useState, useEffect, useCallback } from 'react';

const SB_URL = 'https://hcmpjrqpjohksoznoycq.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbXBqcnFwam9oa3Nvem5veWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk0NjAsImV4cCI6MjA4ODU3NTQ2MH0.XRWi4ZULpICkTucXgGVQCP5wq1RmVwOFWTdMrOEMDnw';
const UAZAPI_URL = 'https://euhenrique.uazapi.com';

const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function sbGet(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers });
  return r.json();
}

async function sbPatch(table, id, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return r.json();
}

async function sbPost(table, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  return r.json();
}

export function useFollowUps(session) {
  const [followUps, setFollowUps] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uazToken, setUazToken] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const [fus, tpls, settings, leadsRaw] = await Promise.all([
        sbGet('follow_ups?order=due_date.asc&select=*'),
        sbGet('follow_up_templates?is_active=eq.true&order=cadence_day.asc&select=*'),
        sbGet('admin_settings?key=eq.uazapi_token&select=value'),
        sbGet('n8n_leads_imobiliaria?select=id,name,phone,classificacao&order=name.asc&limit=200'),
      ]);
      setFollowUps(Array.isArray(fus) ? fus : []);
      setTemplates(Array.isArray(tpls) ? tpls : []);
      setUazToken(settings?.[0]?.value || '');
      setLeads(Array.isArray(leadsRaw) ? leadsRaw : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  // --- Ações ---
  const markSent = useCallback(async (id) => {
    await sbPatch('follow_ups', id, { status: 'enviado', sent_at: new Date().toISOString() });
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'enviado', sent_at: new Date().toISOString() } : f));
  }, []);

  const markResponded = useCallback(async (id) => {
    await sbPatch('follow_ups', id, { status: 'respondido', response_at: new Date().toISOString() });
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'respondido' } : f));
  }, []);

  const reschedule = useCallback(async (id, newDate) => {
    await sbPatch('follow_ups', id, { due_date: newDate });
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, due_date: newDate } : f));
  }, []);

  const delay1Day = useCallback(async (id, currentDue) => {
    const newDate = new Date(new Date(currentDue).getTime() + 86400000).toISOString();
    await sbPatch('follow_ups', id, { due_date: newDate });
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, due_date: newDate } : f));
  }, []);

  const sendWhatsApp = useCallback(async (followUp) => {
    if (!uazToken) { alert('Token UAZAPI não configurado em Configurações.'); return false; }
    const phone = followUp.lead_phone?.replace(/\D/g, '');
    if (!phone) { alert('Número de telefone não encontrado.'); return false; }
    try {
      const r = await fetch(`${UAZAPI_URL}/send/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token: uazToken },
        body: JSON.stringify({ number: phone, text: followUp.message_text }),
      });
      if (r.ok) {
        await markSent(followUp.id);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [uazToken, markSent]);

  const createFollowUp = useCallback(async (data) => {
    const result = await sbPost('follow_ups', { ...data, status: 'pendente' });
    if (Array.isArray(result) && result[0]) {
      setFollowUps(prev => [...prev, result[0]]);
    }
    return result;
  }, []);

  // --- Métricas ---
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const pendentes = followUps.filter(f => f.status === 'pendente');
  const atrasados = pendentes.filter(f => f.due_date.slice(0, 10) < todayStr);
  const enviados = followUps.filter(f => f.status === 'enviado');
  const respondidos = followUps.filter(f => f.status === 'respondido');
  const taxaResposta = enviados.length + respondidos.length > 0
    ? Math.round((respondidos.length / (enviados.length + respondidos.length)) * 100)
    : 0;

  return {
    followUps, templates, leads, isLoading,
    metrics: { pendentes: pendentes.length, atrasados: atrasados.length, enviados: enviados.length, taxaResposta },
    markSent, markResponded, reschedule, delay1Day, sendWhatsApp, createFollowUp, reload: load,
    todayStr, tomorrowStr,
  };
}
