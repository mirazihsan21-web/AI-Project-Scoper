// Sample briefs for visitors who arrive without one. Same texts as evals/briefs/01–03.

export const SAMPLE_BRIEFS = [
  {
    label: "a WhatsApp chat",
    brief: `[10:02] Rafi: bro u do apps right??
[10:02] Rafi: i own a gym (FitZone, 2 branches) need something for members
[10:03] Rafi: they should book classes from phone, yoga, hiit, spin etc
[10:03] Rafi: pay monthly membership online, now everyone pays cash lol
[10:04] Rafi: trainers need to see who is coming
[10:05] Rafi: maybe whatsapp reminder before class?? members always forget
[10:05] Rafi: also i want to see which classes are full and which are dead
[10:06] Rafi: budget is tight tho, want to launch before january`,
  },
  {
    label: "a client email",
    brief: `Subject: Website + online orders for Sweet Crumbs Bakery

Hi there,

We're a family bakery with one shop. Right now people order custom cakes by phone and Instagram DMs and
it's chaos - we lose orders and mix up dates. We'd love a site where customers can pick a cake, choose size,
flavour and a message, pick a pickup date (we need 3 days notice), and pay a 50% deposit online.

We also want a simple screen in the kitchen showing what's due each day. Our menu changes seasonally so
we need to update it ourselves. Would be nice to send customers a text when the cake is ready.

We use Square for our in-store POS, not sure if that matters.

Thanks,
Maria`,
  },
  {
    label: "call notes",
    brief: `Call notes - Dr. Haque, dental clinic chain (4 clinics, ~20 dentists)
- patients book by phone, receptionists overloaded
- want online booking: pick clinic, dentist, treatment type, slot
- treatment types have different durations (cleaning 30m, root canal 90m)
- reminders by SMS 24h before, reduce no-shows (currently ~15%)
- patients should see past visits + invoices
- existing practice software: Dentrix (on-prem) - "would be great if bookings sync"
- admin wants report of no-shows per clinic
- data privacy is a concern, patient records
- timeline: pilot in 1 clinic first`,
  },
] as const;
