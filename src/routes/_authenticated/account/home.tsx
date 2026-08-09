import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { deletePet, getHomeProfile, savePet, saveHomeProfile } from "@/lib/account.functions";
import { ENTRY_METHODS, PET_KINDS, SCENT_PREFERENCES } from "@/lib/account-schemas";
import { ADDONS } from "@/lib/pricing";
import { Card } from "@/components/account/AccountShell";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/home")({
  head: () => ({
    meta: [
      { title: "Home profile — Magnolia Maids" },
      { name: "description", content: "Store your home details, entry instructions, pets, and cleaning preferences so every Magnolia Maids visit runs smoothly." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomeProfile,
});

const inputCls = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm";

type FormState = {
  entryMethod: string;
  entryCode: string;
  lockboxLocation: string;
  alarmInstructions: string;
  parkingNotes: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  skipRooms: string;
  focusRooms: string;
  productPreferences: string;
  scentPreference: string;
  suppliesNotes: string;
  preferredFrequency: string;
  preferredDay: string;
  preferredWindow: string;
  standingAddons: string[];
  billingEmail: string;
  billingPhone: string;
};

const EMPTY: FormState = {
  entryMethod: "someone_home",
  entryCode: "",
  lockboxLocation: "",
  alarmInstructions: "",
  parkingNotes: "",
  address: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  skipRooms: "",
  focusRooms: "",
  productPreferences: "",
  scentPreference: "",
  suppliesNotes: "",
  preferredFrequency: "",
  preferredDay: "",
  preferredWindow: "",
  standingAddons: [],
  billingEmail: "",
  billingPhone: "",
};

function HomeProfile() {
  const homeFn = useServerFn(getHomeProfile);
  const saveFn = useServerFn(saveHomeProfile);
  const petFn = useServerFn(savePet);
  const removePetFn = useServerFn(deletePet);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["account", "home"], queryFn: () => homeFn({}) });
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState({ name: "", kind: "dog", temperament: "", locationDuringClean: "", notes: "" });

  useEffect(() => {
    const h = data?.home;
    if (!h) return;
    setForm({
      entryMethod: h.entry_method ?? "someone_home",
      entryCode: h.entry_code ?? "",
      lockboxLocation: h.lockbox_location ?? "",
      alarmInstructions: h.alarm_instructions ?? "",
      parkingNotes: h.parking_notes ?? "",
      address: h.address ?? "",
      bedrooms: h.bedrooms ?? "",
      bathrooms: h.bathrooms ?? "",
      squareFeet: h.square_feet ? String(h.square_feet) : "",
      skipRooms: h.skip_rooms ?? "",
      focusRooms: h.focus_rooms ?? "",
      productPreferences: h.product_preferences ?? "",
      scentPreference: h.scent_preference ?? "",
      suppliesNotes: h.supplies_notes ?? "",
      preferredFrequency: h.preferred_frequency ?? "",
      preferredDay: h.preferred_day ?? "",
      preferredWindow: h.preferred_window ?? "",
      standingAddons: h.standing_addons ?? [],
      billingEmail: h.billing_email ?? "",
      billingPhone: h.billing_phone ?? "",
    });
  }, [data?.home]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: form } as never),
    onSuccess: () => {
      setSaved(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["account", "home"] });
      setTimeout(() => setSaved(false), 4000);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not save"),
  });

  const addPet = useMutation({
    mutationFn: () => petFn({ data: pet } as never),
    onSuccess: () => {
      setPet({ name: "", kind: "dog", temperament: "", locationDuringClean: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["account", "home"] });
    },
  });

  const removePet = useMutation({
    mutationFn: (id: string) => removePetFn({ data: { id } } as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["account", "home"] }),
  });

  const set = (k: keyof FormState, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Home profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill this in once. Every cleaner sees it before they arrive — no calls, no guessing.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-5"
      >
        <Card title="Entry & access">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              How do we get in?
              <select value={form.entryMethod} onChange={(e) => set("entryMethod", e.target.value)} className={inputCls}>
                {ENTRY_METHODS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Gate / door / alarm code
              <input value={form.entryCode} maxLength={60} onChange={(e) => set("entryCode", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Lockbox location
              <input
                value={form.lockboxLocation}
                maxLength={200}
                onChange={(e) => set("lockboxLocation", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="text-sm font-semibold">
              Parking notes
              <input value={form.parkingNotes} maxLength={300} onChange={(e) => set("parkingNotes", e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold">
            Alarm / security instructions
            <textarea
              rows={2}
              maxLength={500}
              value={form.alarmInstructions}
              onChange={(e) => set("alarmInstructions", e.target.value)}
              className={inputCls}
            />
          </label>
        </Card>

        <Card title="Home details">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              Service address
              <input value={form.address} maxLength={300} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Bedrooms
              <input value={form.bedrooms} maxLength={20} onChange={(e) => set("bedrooms", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Bathrooms
              <input value={form.bathrooms} maxLength={20} onChange={(e) => set("bathrooms", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Approx. square feet
              <input
                inputMode="numeric"
                value={form.squareFeet}
                onChange={(e) => set("squareFeet", e.target.value.replace(/\D/g, ""))}
                className={inputCls}
              />
            </label>
            <label className="text-sm font-semibold">
              Scent preference
              <select value={form.scentPreference} onChange={(e) => set("scentPreference", e.target.value)} className={inputCls}>
                <option value="">No preference</option>
                {SCENT_PREFERENCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card title="Cleaning preferences">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Rooms to focus on
              <textarea rows={2} maxLength={500} value={form.focusRooms} onChange={(e) => set("focusRooms", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Rooms to skip
              <textarea rows={2} maxLength={500} value={form.skipRooms} onChange={(e) => set("skipRooms", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Product preferences
              <textarea
                rows={2}
                maxLength={500}
                value={form.productPreferences}
                onChange={(e) => set("productPreferences", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="text-sm font-semibold">
              Supplies notes
              <textarea rows={2} maxLength={500} value={form.suppliesNotes} onChange={(e) => set("suppliesNotes", e.target.value)} className={inputCls} />
            </label>
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Standing add-ons</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ADDONS.map((a) => {
                const on = form.standingAddons.includes(a.key);
                return (
                  <button
                    type="button"
                    key={a.key}
                    onClick={() =>
                      set(
                        "standingAddons",
                        on ? form.standingAddons.filter((k) => k !== a.key) : [...form.standingAddons, a.key],
                      )
                    }
                    className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                      on ? "bg-accent text-accent-foreground shadow-bloom" : "border border-border text-foreground/70"
                    }`}
                  >
                    {a.label} · ${a.price}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </Card>

        <Card title="Recurring plan & billing">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold">
              Preferred frequency
              <select value={form.preferredFrequency} onChange={(e) => set("preferredFrequency", e.target.value)} className={inputCls}>
                <option value="">No preference</option>
                {["Weekly", "Biweekly", "Monthly", "One-time"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Preferred day
              <select value={form.preferredDay} onChange={(e) => set("preferredDay", e.target.value)} className={inputCls}>
                <option value="">No preference</option>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Preferred window
              <select value={form.preferredWindow} onChange={(e) => set("preferredWindow", e.target.value)} className={inputCls}>
                <option value="">No preference</option>
                {["Morning (8–11am)", "Midday (11am–2pm)", "Afternoon (2–5pm)"].map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Billing email
              <input type="email" value={form.billingEmail} onChange={(e) => set("billingEmail", e.target.value)} className={inputCls} />
            </label>
            <label className="text-sm font-semibold">
              Billing phone
              <input value={form.billingPhone} maxLength={40} onChange={(e) => set("billingPhone", e.target.value)} className={inputCls} />
            </label>
          </div>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="sticky bottom-3 z-10 flex items-center gap-3">
          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground shadow-bloom disabled:opacity-60 sm:w-auto"
          >
            {save.isPending ? "Saving…" : "Save home profile"}
          </button>
          {saved && <span className="text-sm font-semibold text-laurel">Saved</span>}
        </div>
      </form>

      <Card title="Pets">
        {(data?.pets ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No pets on file yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {(data?.pets ?? []).map((p) => (
              <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {p.name} <span className="font-normal text-muted-foreground">· {p.kind}</span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[p.temperament, p.location_during_clean, p.notes].filter(Boolean).join(" · ") || "No notes"}
                  </p>
                </div>
                <button
                  aria-label={`Remove ${p.name}`}
                  onClick={() => removePet.mutate(p.id)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pet.name.trim()) addPet.mutate();
          }}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-sm font-semibold">
            Pet name
            <input value={pet.name} maxLength={60} onChange={(e) => setPet({ ...pet, name: e.target.value })} className={inputCls} />
          </label>
          <label className="text-sm font-semibold">
            Type
            <select value={pet.kind} onChange={(e) => setPet({ ...pet, kind: e.target.value })} className={inputCls}>
              {PET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Temperament
            <input
              value={pet.temperament}
              maxLength={120}
              placeholder="Friendly, shy, barks at the door…"
              onChange={(e) => setPet({ ...pet, temperament: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-semibold">
            Where they'll be
            <input
              value={pet.locationDuringClean}
              maxLength={160}
              placeholder="Crated, backyard, roaming…"
              onChange={(e) => setPet({ ...pet, locationDuringClean: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Notes for the cleaner
            <textarea rows={2} maxLength={400} value={pet.notes} onChange={(e) => setPet({ ...pet, notes: e.target.value })} className={inputCls} />
          </label>
          <button
            type="submit"
            disabled={addPet.isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-bold disabled:opacity-60 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> {addPet.isPending ? "Adding…" : "Add pet"}
          </button>
        </form>
      </Card>
    </div>
  );
}