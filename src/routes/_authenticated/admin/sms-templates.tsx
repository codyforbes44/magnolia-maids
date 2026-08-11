import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SectionCard, FieldGroup, inputClass, EmptyState } from "@/components/admin/ui";
import {
  SMS_TEMPLATES,
  SMS_VARIABLE_DEFAULTS,
  SMS_VARIABLE_LABELS,
  renderSmsBody,
  smsSegments,
  type SmsVariableKey,
} from "@/lib/sms/catalog";
import {
  loadSmsTemplateState,
  saveSmsTemplate,
  resetSmsTemplate,
  listSmsTemplateVersions,
  rollbackSmsTemplate,
  saveSmsVariables,
  sendSmsTemplateTest,
  type SmsTemplateRecord,
  type SmsTemplateVersion,
} from "@/lib/admin/sms-templates.functions";

export const Route = createFileRoute("/_authenticated/admin/sms-templates")({
  head: () => ({
    meta: [
      { title: "Admin — SMS templates | Magnolia Maids" },
      {
        name: "description",
        content:
          "Edit every automated Magnolia Maids text message, preview it with sample variables, and roll back to any saved version.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SmsTemplatesPage,
});

const AUDIENCE_STYLES: Record<string, string> = {
  Customer: "bg-laurel/10 text-laurel border border-laurel/30",
  Internal: "bg-amber-100 text-amber-900 border border-amber-300",
  Lead: "bg-sky-100 text-sky-900 border border-sky-300",
  Compliance: "bg-secondary text-muted-foreground border border-border",
};

const VARIABLE_KEYS = Object.keys(SMS_VARIABLE_DEFAULTS) as SmsVariableKey[];

function SmsTemplatesPage() {
  const load = useServerFn(loadSmsTemplateState);
  const save = useServerFn(saveSmsTemplate);
  const reset = useServerFn(resetSmsTemplate);
  const listVersions = useServerFn(listSmsTemplateVersions);
  const rollback = useServerFn(rollbackSmsTemplate);
  const saveVars = useServerFn(saveSmsVariables);
  const sendTest = useServerFn(sendSmsTemplateTest);

  const [selectedId, setSelectedId] = useState(SMS_TEMPLATES[0]!.id);
  const [overrides, setOverrides] = useState<Record<string, SmsTemplateRecord>>({});
  const [variables, setVariables] = useState<Record<string, string>>({
    ...SMS_VARIABLE_DEFAULTS,
  });
  const [draft, setDraft] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [versions, setVersions] = useState<SmsTemplateVersion[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testPhone, setTestPhone] = useState("");

  // Remember the tester's number so future sends are a single click.
  useEffect(() => {
    const saved = window.localStorage.getItem("mm-admin-test-phone");
    if (saved) setTestPhone(saved);
  }, []);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);

  async function handleTestSend() {
    setTestBusy(true);
    setTestResult(null);
    try {
      const res = await sendTest({
        data: { templateId: selectedId, body: draft, to: testPhone, variables },
      });
      window.localStorage.setItem("mm-admin-test-phone", testPhone.trim());
      setTestResult(
        res.sent
          ? { ok: true, message: `Test text sent to ${res.to}. Check your phone.` }
          : {
              ok: false,
              message: `Twilio did not accept the message (${res.reason ?? "unknown"}).`,
            },
      );
    } catch (e) {
      setTestResult({
        ok: false,
        message: e instanceof Error ? e.message : "Could not send the test text.",
      });
    } finally {
      setTestBusy(false);
    }
  }

  const template = useMemo(
    () => SMS_TEMPLATES.find((t) => t.id === selectedId)!,
    [selectedId],
  );

  async function refreshState() {
    const state = await load({ data: undefined });
    const map: Record<string, SmsTemplateRecord> = {};
    for (const o of state.overrides) map[o.templateId] = o;
    setOverrides(map);
    setVariables({ ...SMS_VARIABLE_DEFAULTS, ...state.variables });
    return map;
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshState();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Could not load templates");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the editor + history whenever the selected template or overrides change.
  useEffect(() => {
    const stored = overrides[selectedId];
    setDraft(stored?.body ?? template.defaultBody);
    setEnabled(stored?.enabled ?? true);
    setStatus(null);
    (async () => {
      try {
        setVersions(await listVersions({ data: { templateId: selectedId } }));
      } catch {
        setVersions([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, overrides]);

  const preview = renderSmsBody(draft, variables);
  const segments = smsSegments(preview);
  const isCustomized = Boolean(overrides[selectedId]);
  const isDirty = draft !== (overrides[selectedId]?.body ?? template.defaultBody);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      await refreshState();
      setStatus(label);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="SMS templates"
        description="Edit the wording of every automated text, preview it with your default variables, and roll back to any saved version."
        actions={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run("Default variables saved.", () => saveVars({ data: { variables } }))
              }
              className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              Save default variables
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setVariables({ ...SMS_VARIABLE_DEFAULTS })}
              className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              Reset variables
            </button>
          </>
        }
      />

      {status && (
        <div className="mb-5 rounded-2xl border border-border/60 bg-secondary/60 px-4 py-3 text-sm">
          {status}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
        {/* Template list */}
        <SectionCard title="Templates" description="Pick a message to edit.">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <nav className="grid gap-1.5">
              {SMS_TEMPLATES.map((t) => {
                const custom = Boolean(overrides[t.id]);
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <span className="block font-semibold">{t.title}</span>
                    <span
                      className={`text-[11px] ${active ? "opacity-80" : "text-muted-foreground"}`}
                    >
                      {custom ? "Customized" : "Built-in"}
                      {overrides[t.id] && overrides[t.id]!.enabled === false ? " · paused" : ""}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </SectionCard>

        <div className="grid gap-6">
          {/* Editor + preview */}
          <SectionCard
            title={template.title}
            description={template.trigger}
            action={
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  AUDIENCE_STYLES[template.audience]
                }`}
              >
                {template.audience}
              </span>
            }
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="grid gap-3">
                <FieldGroup label="Message body">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={12}
                    className={`${inputClass} font-mono text-[13px] leading-relaxed`}
                  />
                </FieldGroup>

                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDraft((d) => `${d}{{${v}}}`)}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-secondary"
                      title={`Insert ${SMS_VARIABLE_LABELS[v]}`}
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  Template is active
                </label>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run("Saved. A version was added to history.", () =>
                        save({ data: { templateId: selectedId, body: draft, enabled } }),
                      )
                    }
                    className="tap-target rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isDirty ? "Save changes" : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDraft(template.defaultBody)}
                    className="tap-target rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
                  >
                    Load built-in wording
                  </button>
                  {isCustomized && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run("Reverted to the built-in wording.", () =>
                          reset({ data: { templateId: selectedId } }),
                        )
                      }
                      className="tap-target rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Remove customization
                    </button>
                  )}
                </div>
              </div>

              <div className="grid content-start gap-3">
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <div className="max-w-[19rem] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-laurel/10 px-4 py-3 text-sm leading-relaxed">
                    {preview || "—"}
                  </div>
                </div>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {preview.length} chars · {segments} segment{segments === 1 ? "" : "s"}
                  {isDirty ? " · unsaved changes" : ""}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Version history */}
          <SectionCard
            title="Send a test text"
            description="Sends the wording in the editor above — rendered with your current variables — to your own phone. Nothing is saved and the customer opt-out list is bypassed for this admin test only."
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <FieldGroup label="Your mobile number">
                <input
                  className={inputClass}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(580) 745-0045"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </FieldGroup>
              <button
                type="button"
                disabled={testBusy || busy || testPhone.trim().length < 7}
                onClick={handleTestSend}
                className="tap-target rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {testBusy ? "Sending…" : "Send test to my phone"}
              </button>
            </div>
            <p className="mt-3 text-xs tabular-nums text-muted-foreground">
              Will send {preview.length} chars · {segments} segment{segments === 1 ? "" : "s"}
              {isDirty ? " · using unsaved wording" : ""}
            </p>
            {testResult && (
              <div
                className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                  testResult.ok
                    ? "bg-laurel/10 text-laurel"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {testResult.message}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Version history"
            description="Every save is snapshotted. Restore any earlier wording."
          >
            {versions.length === 0 ? (
              <EmptyState
                title="No saved versions yet"
                hint="Your first save will start the history for this template."
              />
            ) : (
              <ul className="grid gap-3">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="grid gap-3 rounded-2xl border border-border/60 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {new Date(v.createdAt).toLocaleString()} · {v.note ?? "Saved"}
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm">
                        {v.body}
                      </pre>
                    </div>
                    <div className="flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDraft(v.body)}
                        className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run("Rolled back to the selected version.", () =>
                            rollback({ data: { versionId: v.id } }),
                          )
                        }
                        className="tap-target rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        Restore
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Default variables */}
          <SectionCard
            title="Default variables"
            description="Sample values used for the preview above. Saved values persist for everyone on the team."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VARIABLE_KEYS.map((k) => (
                <FieldGroup key={k} label={`${SMS_VARIABLE_LABELS[k]} · {{${k}}}`}>
                  <input
                    className={inputClass}
                    value={variables[k] ?? ""}
                    onChange={(e) =>
                      setVariables((prev) => ({ ...prev, [k]: e.target.value }))
                    }
                  />
                </FieldGroup>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
