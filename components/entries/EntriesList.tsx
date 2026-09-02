"use client";

import { InlineText, InlineAmount, RemoveButton } from "@/components/ui/InlineEdit";
import {
  useDeleteExpense,
  useDeleteIncome,
  useDeleteTransfer,
  useUpdateExpense,
  useUpdateIncome,
  useUpdateTransfer,
} from "@/lib/hooks/useDashboard";
import type { ExpenseEntry, IncomeEntry, Pot, Transfer } from "@/lib/types";

const isTemp = (id: string) => id.startsWith("temp-");

export default function EntriesList({
  income,
  expenses,
  transfers,
  pots,
  ym,
}: {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  transfers: Transfer[];
  pots: Pot[];
  ym: string;
}) {
  const updateIncome = useUpdateIncome(ym);
  const deleteIncome = useDeleteIncome(ym);
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const updateTransfer = useUpdateTransfer(ym);
  const deleteTransfer = useDeleteTransfer(ym);

  const potName = (id: string | null) =>
    pots.find((p) => p.id === id)?.name ?? "Pot";

  const empty =
    income.length === 0 && expenses.length === 0 && transfers.length === 0;

  return (
    <section className="glass p-6">
      <p className="eyebrow mb-1">This month</p>
      <p className="mb-4 text-xs text-faint">Tap any underlined value to edit it, or tap × to remove a row.</p>

      {empty && <p className="py-2 text-sm text-faint">No entries yet. Add income or an expense.</p>}

      {income.length > 0 && (
        <>
          <p className="mb-1 mt-1 text-xs font-medium text-muted">Income</p>
          <ul className="divide-y divide-[var(--edge)]">
            {income.map((r) => (
              <li
                key={r.id}
                className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors focus-within:bg-surface-2/60"
              >
                <div className="min-w-0 flex-1">
                  {isTemp(r.id) ? (
                    <span className="truncate text-ink">{r.source_name}</span>
                  ) : (
                    <InlineText
                      value={r.source_name}
                      onCommit={(v) =>
                        updateIncome.mutate({ id: r.id, amount: Number(r.amount), source: v || "Income" })
                      }
                      grow
                      className="text-ink"
                    />
                  )}
                </div>
                <span className="flex items-center gap-2">
                  {isTemp(r.id) ? (
                    <span className="tnum text-positive">₹{Number(r.amount).toLocaleString("en-IN")}</span>
                  ) : (
                    <>
                      <InlineAmount
                        value={Number(r.amount)}
                        onCommit={(n) => updateIncome.mutate({ id: r.id, amount: n, source: r.source_name })}
                        className="text-positive"
                      />
                      <RemoveButton onClick={() => deleteIncome.mutate(r.id)} />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {expenses.length > 0 && (
        <>
          <p className="mb-1 mt-4 text-xs font-medium text-muted">Expenses</p>
          <ul className="divide-y divide-[var(--edge)]">
            {expenses.map((r) => (
              <li
                key={r.id}
                className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors focus-within:bg-surface-2/60"
              >
                <div className="min-w-0 flex-1">
                  {isTemp(r.id) ? (
                    <span className="truncate text-ink">{r.category ?? "Expense"}</span>
                  ) : (
                    <InlineText
                      value={r.category ?? ""}
                      onCommit={(v) =>
                        updateExpense.mutate({
                          id: r.id,
                          amount: Number(r.amount),
                          bucket: r.bucket_key ?? "personal",
                          category: v || "Expense",
                        })
                      }
                      placeholder="Category"
                      grow
                      className="text-ink"
                    />
                  )}
                </div>
                <span className="flex items-center gap-2">
                  {isTemp(r.id) ? (
                    <span className="tnum text-negative">₹{Number(r.amount).toLocaleString("en-IN")}</span>
                  ) : (
                    <>
                      <InlineAmount
                        value={Number(r.amount)}
                        onCommit={(n) =>
                          updateExpense.mutate({
                            id: r.id,
                            amount: n,
                            bucket: r.bucket_key ?? "personal",
                            category: r.category ?? "Expense",
                          })
                        }
                        className="text-negative"
                      />
                      <RemoveButton onClick={() => deleteExpense.mutate(r.id)} />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {transfers.length > 0 && (
        <>
          <p className="mb-1 mt-4 text-xs font-medium text-muted">Allocations</p>
          <ul className="divide-y divide-[var(--edge)]">
            {transfers.map((r) => (
              <li
                key={r.id}
                className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors focus-within:bg-surface-2/60"
              >
                <span className="min-w-0 flex-1 truncate text-ink">
                  <span className="text-faint">→ </span>
                  {potName(r.pot_id)}
                </span>
                <span className="flex items-center gap-2">
                  {isTemp(r.id) ? (
                    <span className="tnum text-accent">₹{Number(r.amount).toLocaleString("en-IN")}</span>
                  ) : (
                    <>
                      <InlineAmount
                        value={Number(r.amount)}
                        onCommit={(n) => updateTransfer.mutate({ id: r.id, amount: n })}
                        className="text-accent"
                      />
                      <RemoveButton onClick={() => deleteTransfer.mutate(r.id)} />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
