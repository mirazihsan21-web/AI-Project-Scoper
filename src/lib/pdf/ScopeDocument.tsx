import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { StoredScope } from "@/lib/db/scopes";
import { formatMoneyRange, formatWeeks } from "@/lib/format";
import {
  FEATURE_TYPE_LABELS,
  INTEGRATION_TYPE_LABELS,
  PRIORITY_LABELS,
  PROJECT_TYPE_LABELS,
  SEVERITY_LABELS,
} from "@/lib/labels";
import type { TierEstimate } from "@/lib/pricing/estimate";
import { BRAND_NAME } from "@/lib/brand";
import { PRIORITIES } from "@/lib/scope/schema";

// Same tokens as src/app/globals.css; the PDF is white for printing.
const INK = "#1E2638";
const SOFT = "#545C6E";
const RULE = "#D8DBD2";
const PEN = "#2B44D6";
const HIGHLIGHT = { must: "#FFE14D", should: "#A6EBC9", could: "#D7C9FF" } as const;
const BODY = 10.5;

const s = StyleSheet.create({
  // react-pdf line heights only come out right when set together with fontSize on the same style.
  // On the Page, lineHeight also makes the absolutely positioned footer vanish (found by rendering).
  page: { fontFamily: "Schibsted", fontSize: BODY, color: INK, paddingTop: 44, paddingBottom: 64, paddingHorizontal: 52 },
  p: { fontSize: BODY, lineHeight: 1.4 },
  brand: { fontSize: 10, fontWeight: 800 },
  title: { fontSize: 26, fontWeight: 800, lineHeight: 1.1, marginTop: 18, letterSpacing: -0.4 },
  summary: { fontSize: 12, lineHeight: 1.4, marginTop: 8 },
  meta: { fontSize: 9.5, color: SOFT, marginTop: 6 },
  priceBox: { marginTop: 18, borderWidth: 1.5, borderColor: INK, borderRadius: 4, padding: 16 },
  tiers: { flexDirection: "row", columnGap: 24 },
  tier: { flex: 1 },
  tierName: { fontSize: 11, fontWeight: 600 },
  tierDetail: { fontSize: 9.5, color: SOFT },
  price: { fontSize: 18, fontWeight: 800, lineHeight: 1.25, marginTop: 6 },
  note: { fontSize: 8.5, lineHeight: 1.4, color: SOFT, marginTop: 12, paddingTop: 8, borderTopWidth: 0.75, borderTopColor: RULE },
  h2: { fontSize: 14, fontWeight: 800, lineHeight: 1.25, marginTop: 22, marginBottom: 2 },
  group: { flexDirection: "row", alignItems: "center", columnGap: 5, marginTop: 10, marginBottom: 2 },
  swatch: { width: 8, height: 8, borderRadius: 1.5 },
  groupLabel: { fontSize: 10, fontWeight: 600, color: SOFT },
  item: { marginTop: 7 },
  name: { fontSize: 11, fontWeight: 600 },
  small: { fontSize: 9, color: SOFT },
  soft: { fontSize: BODY, lineHeight: 1.4, color: SOFT },
  step: { flexDirection: "row", marginTop: 8 },
  stepNumber: { width: 20, fontSize: 13, fontWeight: 800, lineHeight: 1.25, color: SOFT },
  stepBody: { flex: 1 },
  columns: { flexDirection: "row", columnGap: 24 },
  column: { flex: 1 },
  bullet: { flexDirection: "row", marginTop: 4 },
  bulletMark: { width: 10 },
  bulletText: { flex: 1, fontSize: BODY, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 28, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: SOFT },
  link: { color: PEN, textDecoration: "none" },
});

function Tier({ name, detail, tier, currency }: { name: string; detail: string; tier: TierEstimate; currency: string }) {
  return (
    <View style={s.tier}>
      <Text style={s.tierName}>{name}</Text>
      <Text style={s.tierDetail}>{detail}</Text>
      <Text style={s.price}>{formatMoneyRange(tier.priceLow, tier.priceHigh, currency)}</Text>
      <Text>{formatWeeks(tier.weeksLow, tier.weeksHigh)}</Text>
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return items.map((item) => (
    <View key={item} style={s.bullet} wrap={false}>
      <Text style={s.bulletMark}>•</Text>
      <Text style={s.bulletText}>{item}</Text>
    </View>
  ));
}

export function ScopeDocument({ stored, scopeUrl }: { stored: StoredScope; scopeUrl: string }) {
  const { scope, estimate } = stored;
  const rates = estimate.assumptions;
  const scopedOn = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(stored.createdAt));

  return (
    <Document title={`${scope.projectTitle}: project scope`} author={BRAND_NAME} creator={BRAND_NAME}>
      <Page size="A4" style={s.page}>
        {/* Fixed elements go first: react-pdf repeats them on each page as it paginates. */}
        <View style={s.footer} fixed>
          <Link src={scopeUrl} style={s.link}>
            {scopeUrl}
          </Link>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
        <Text style={s.brand}>{BRAND_NAME}</Text>
        <Text style={s.title}>{scope.projectTitle}</Text>
        <Text style={s.summary}>{scope.summary}</Text>
        <Text style={s.meta}>
          {PROJECT_TYPE_LABELS[scope.projectType]}, scoped on {scopedOn}.
        </Text>

        <View style={s.priceBox} wrap={false}>
          <View style={s.tiers}>
            <Tier name="First version" detail="The must-haves, ready to launch" tier={estimate.mvp} currency={rates.currency} />
            <Tier name="Full build" detail="Everything listed below" tier={estimate.full} currency={rates.currency} />
          </View>
          <Text style={s.note}>
            A rough estimate from assumed rates: {formatMoneyRange(rates.hourlyRate, rates.hourlyRate, rates.currency)} an hour,
            plus {Math.round(rates.overheadPct * 100)}% for project management and testing and a{" "}
            {Math.round(rates.contingencyPct * 100)}% buffer for the risks below. A call firms it up.
          </Text>
        </View>

        <Text style={s.h2} minPresenceAhead={60}>
          What we&apos;d build
        </Text>
        {PRIORITIES.map((priority) => {
          const features = scope.features.filter((f) => f.priority === priority);
          if (features.length === 0) return null;
          return (
            <View key={priority}>
              {features.map((f, index) => (
                <View key={f.name} style={s.item} wrap={false}>
                  {index === 0 && (
                    <View style={s.group}>
                      <View style={[s.swatch, { backgroundColor: HIGHLIGHT[priority] }]} />
                      <Text style={s.groupLabel}>{PRIORITY_LABELS[priority]}</Text>
                    </View>
                  )}
                  <Text style={s.name}>
                    <Text style={{ backgroundColor: HIGHLIGHT[priority] }}> {f.name} </Text>
                  </Text>
                  <Text style={s.p}>{f.description}</Text>
                  <Text style={s.small}>{FEATURE_TYPE_LABELS[f.type]}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {scope.integrations.length > 0 && (
          <View>
            {/* Each heading rides with its first item so it is never stranded at the foot of a page. */}
            {scope.integrations.map((i, index) => (
              <View key={i.name} style={s.item} wrap={false}>
                {index === 0 && <Text style={s.h2}>What it connects to</Text>}
                <Text style={s.name}>{i.name}</Text>
                <Text style={s.p}>{i.purpose}</Text>
                <Text style={s.small}>{INTEGRATION_TYPE_LABELS[i.type]}</Text>
              </View>
            ))}
          </View>
        )}

        {scope.risks.map((r, index) => (
          <View key={r.title} style={s.item} wrap={false}>
            {index === 0 && <Text style={s.h2}>Risks</Text>}
            <Text style={s.name}>
              {r.title}
              <Text style={[s.small, { fontWeight: r.severity === "high" ? 800 : 400 }]}>
                {"   "}
                {SEVERITY_LABELS[r.severity]}
              </Text>
            </Text>
            <Text style={s.p}>{r.detail}</Text>
            <Text style={s.soft}>What helps: {r.mitigation}</Text>
          </View>
        ))}

        {scope.milestones.map((m, index) => {
          const timing = estimate.milestones[index];
          return (
            <View key={m.name} wrap={false}>
              {index === 0 && <Text style={s.h2}>Delivery plan</Text>}
              <View style={s.step}>
                <Text style={s.stepNumber}>{index + 1}</Text>
                <View style={s.stepBody}>
                  <Text style={s.name}>
                    {m.name}
                    {timing && timing.hoursHigh > 0 && (
                      <Text style={s.small}>
                        {"   "}
                        {formatWeeks(timing.weeksLow, timing.weeksHigh)}
                      </Text>
                    )}
                  </Text>
                  <Text style={s.p}>{m.goal}</Text>
                  {m.featureNames.length > 0 && <Text style={s.small}>{m.featureNames.join(", ")}</Text>}
                </View>
              </View>
            </View>
          );
        })}

        <View style={s.columns} wrap={false}>
          <View style={s.column}>
            <Text style={s.h2}>What we assumed</Text>
            <Bullets items={scope.assumptions} />
          </View>
          <View style={s.column}>
            <Text style={s.h2}>Questions for a first call</Text>
            <Bullets items={scope.openQuestions} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
