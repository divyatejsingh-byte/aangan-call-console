// Server-only HubSpot push for finished Vaani calls.
const API = 'https://api.hubapi.com';
const PIPELINE = 'default'; // "Design Sales Pipeline"
const STAGE_INITIAL_INQUIRY = '4417941218';

export interface HubspotResult {
  status: 'created' | 'exists' | 'skipped' | 'error';
  dealId?: string;
  contactId?: string;
  note?: string;
  at: string;
}

type Dict = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const o = v as Dict;
    if ('min' in o || 'max' in o) return [o.min, o.max].filter((x) => x !== null && x !== undefined).join(' - ');
    return Object.values(o).filter(Boolean).join(', ');
  }
  return '';
}

async function hs(path: string, init: RequestInit = {}) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured');
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let json: Dict = {};
  try {
    json = text ? (JSON.parse(text) as Dict) : {};
  } catch {}
  if (!res.ok) throw new Error(`HubSpot ${res.status} on ${path}: ${str(json.message).slice(0, 200)}`);
  return json;
}

async function findFirst(objectType: 'deals' | 'contacts', property: string, value: string): Promise<string | null> {
  const r = (await hs(`/crm/v3/objects/${objectType}/search`, {
    method: 'POST',
    body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: property, operator: 'EQ', value }] }], limit: 1 }),
  })) as { results?: { id: string }[] };
  return r.results?.[0]?.id ?? null;
}

/** Push one finished call (the `data` of a call_postprocessing event) to HubSpot. Never throws. */
export async function pushCallToHubspot(data: Dict): Promise<HubspotResult> {
  const at = new Date().toISOString();
  try {
    const roomName = str(data.room_name) || str(data.call_id);
    const entities = (data.entities && typeof data.entities === 'object' ? data.entities : {}) as Dict;
    const property = fmtValue(entities['Property Type & Configuration']);
    const appointment = fmtValue(entities['Appointment Schedule']);
    const duration = Number(data.call_duration) || 0;

    // Only real enquiries become deals: a captured property or a discovery-call request.
    if (!roomName || (!property && !appointment)) {
      return { status: 'skipped', note: 'No property details or appointment captured', at };
    }

    const phoneRaw = str(data.phone_number);
    const phone = /^\+?[\d\s()-]{8,}$/.test(phoneRaw) ? phoneRaw.replace(/[^\d+]/g, '') : '';
    const label = phone || 'Web call';
    const dealName = `${label} · ${property || 'Enquiry'} · ${roomName.slice(-8)}`;

    const existing = await findFirst('deals', 'dealname', dealName);
    if (existing) return { status: 'exists', dealId: existing, note: 'Deal already created for this call', at };

    let contactId: string | undefined;
    if (phone) {
      contactId = (await findFirst('contacts', 'phone', phone)) ?? undefined;
      if (!contactId) {
        const c = (await hs('/crm/v3/objects/contacts', {
          method: 'POST',
          body: JSON.stringify({ properties: { phone, firstname: 'Caller', lastname: phone } }),
        })) as { id: string };
        contactId = c.id;
      }
    }

    const lines = [
      `Source: Vaani voice agent (${str(data.agent_name) || 'inbound'})`,
      str(data.summary),
      '',
      `Property: ${property || '-'}`,
      `Budget: ${fmtValue(entities['Budget Range']) || 'Not captured'}`,
      `Location: ${fmtValue(entities['Location Preference']) || '-'}`,
      `Timeline: ${fmtValue(entities['Timeline']) || '-'}`,
      `Buyer status: ${fmtValue(entities['Market Status']) || '-'}`,
      `Use: ${fmtValue(entities['End-Use Purpose']) || '-'}`,
      `Discovery call requested: ${appointment || 'No'}`,
      `Call length: ${duration ? Math.round(duration) + 's' : '-'}`,
    ];

    const deal = (await hs('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({
        properties: { dealname: dealName, pipeline: PIPELINE, dealstage: STAGE_INITIAL_INQUIRY, description: lines.join('\n') },
      }),
    })) as { id: string };

    if (contactId) {
      await hs(`/crm/v4/objects/deals/${deal.id}/associations/default/contacts/${contactId}`, { method: 'PUT' });
    }
    return { status: 'created', dealId: deal.id, contactId, at };
  } catch (e) {
    return { status: 'error', note: e instanceof Error ? e.message : 'unknown error', at };
  }
}
