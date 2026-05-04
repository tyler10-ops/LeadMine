const LICENSE_KEY = process.env.MELISSA_LICENSE_KEY ?? "";

interface MelissaResult {
  phone?: string;
  email?: string;
  fullName?: string;
}

interface MelissaRecord {
  Results?: string;
  PhoneNumber?: string;
  EmailAddress?: string;
  FullName?: string;
}

interface MelissaResponse {
  Records?: MelissaRecord[];
}

export async function skipTraceLead(params: {
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
}): Promise<MelissaResult> {
  if (!LICENSE_KEY) {
    console.warn("[melissa] MELISSA_LICENSE_KEY not set");
    return {};
  }

  try {
    const url = new URL("https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify");
    url.searchParams.set("id",   LICENSE_KEY);
    url.searchParams.set("act",  "Check");
    url.searchParams.set("first", params.firstName);
    url.searchParams.set("last",  params.lastName);
    url.searchParams.set("a1",    params.addressLine1);
    url.searchParams.set("city",  params.city);
    url.searchParams.set("state", params.state);
    url.searchParams.set("postal",params.zip);
    url.searchParams.set("cols",  "PhoneNumber,EmailAddress,FullName");
    url.searchParams.set("format","json");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return {};

    const data: MelissaResponse = await res.json();
    const record = data?.Records?.[0];
    if (!record) return {};

    return {
      phone:    record.PhoneNumber   || undefined,
      email:    record.EmailAddress  || undefined,
      fullName: record.FullName      || undefined,
    };
  } catch (err) {
    console.warn("[melissa] Skip trace failed:", err);
    return {};
  }
}

export async function skipTraceBatch(
  leads: Array<{ id: string; owner_name: string | null; property_address: string | null; property_city: string | null; property_state: string | null; property_zip: string | null }>
): Promise<Map<string, MelissaResult>> {
  const results = new Map<string, MelissaResult>();

  for (const lead of leads) {
    if (!lead.owner_name || !lead.property_address) continue;

    const nameParts  = lead.owner_name.trim().split(/\s+/);
    const firstName  = nameParts[0] ?? "";
    const lastName   = (nameParts.slice(1).join(" ") || nameParts[0]) ?? "";

    const result = await skipTraceLead({
      firstName,
      lastName,
      addressLine1: lead.property_address ?? "",
      city:         lead.property_city    ?? "",
      state:        lead.property_state   ?? "",
      zip:          lead.property_zip     ?? "",
    });

    if (result.phone || result.email) {
      results.set(lead.id, result);
    }

    // 100ms delay between calls to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  return results;
}