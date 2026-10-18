import type { Db } from "./client";

export type NewLead = {
  scopeId: string;
  name: string;
  email: string;
  company?: string | null;
  notes?: string | null;
};

export async function insertLead(db: Db, lead: NewLead): Promise<number> {
  const { data, error } = await db
    .from("leads")
    .insert({
      scope_id: lead.scopeId,
      name: lead.name,
      email: lead.email,
      company: lead.company ?? null,
      notes: lead.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`insertLead failed: ${error.message}`);
  return data.id;
}

/** Records that the owner was emailed; leads with notified_at null still need a notification. */
export async function markLeadNotified(db: Db, id: number): Promise<void> {
  const { error } = await db.from("leads").update({ notified_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`markLeadNotified failed: ${error.message}`);
}
