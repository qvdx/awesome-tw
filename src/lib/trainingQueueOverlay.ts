import styles from "./trainingQueueOverlay.module.css";
import {
  getTrainingQueueFetchedAt,
  getTrainingQueueForVillages,
} from "./trainingQueue";
import { waitForElement } from "./waitForElement";

const QUEUE_ROW_MARKER = "data-awesometw-queue-row";
const TOTAL_FILLER_MARKER = "data-awesometw-total-filler";

export function isUnitsOverviewScreen(): boolean {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("screen") === "overview_villages" &&
    params.get("mode") === "units"
  );
}

/**
 * Ordem das unidades nas colunas da tabela, lida do próprio cabeçalho (ícone
 * de cada `<th>` → id da unidade) — evita depender de uma ordem fixa, que
 * varia entre mundos com unidades desativadas.
 */
export function getColumnUnitIds(table: HTMLTableElement): string[] {
  const ids: string[] = [];
  table
    .querySelectorAll<HTMLImageElement>("thead th img[src]")
    .forEach((img) => {
      const match = img.src.match(/unit_([a-z]+)\.webp/);
      if (match) ids.push(match[1]);
    });
  return ids;
}

function getVillageId(tbody: HTMLTableSectionElement): number | null {
  const raw = tbody.querySelector<HTMLElement>(".quickedit-vn")?.dataset.id;
  return raw ? Number(raw) : null;
}

export function buildQueueRow(
  unitIds: string[],
  queue: Record<string, number>,
): HTMLTableRowElement {
  const row = document.createElement("tr");
  row.setAttribute(QUEUE_ROW_MARKER, "true");

  // essa linha entra ANTES do "total" (ver injectQueueRows), então ela fica
  // dentro das linhas cobertas pelo rowspan da coluna "Aldeia" — não precisa
  // de célula vazia própria, igual às linhas nativas "suas próprias"/"total"
  const hasQueue = unitIds.some((unitId) => (queue[unitId] ?? 0) > 0);

  const label = document.createElement("td");
  label.append("recrutando");

  const statusDot = document.createElement("span");
  statusDot.className = `${styles.statusDot} ${hasQueue ? styles.statusDotActive : styles.statusDotInactive}`;
  statusDot.setAttribute("aria-hidden", "true");
  label.append(statusDot);

  row.append(label);

  unitIds.forEach((unitId) => {
    const quantity = queue[unitId] ?? 0;
    const cell = document.createElement("td");
    cell.className = quantity > 0 ? "unit-item" : "unit-item hidden";
    cell.textContent = String(quantity);
    row.append(cell);
  });

  row.append(document.createElement("td"));
  return row;
}

/** A linha nativa de totais tem sempre "total" no primeiro `<td>` — é onde a linha injetada deve ficar em cima. */
function findTotalRow(
  tbody: HTMLTableSectionElement,
): HTMLTableRowElement | null {
  const rows = [...tbody.querySelectorAll<HTMLTableRowElement>("tr")];
  return (
    rows.find(
      (row) =>
        row.querySelector("td")?.textContent?.trim().toLowerCase() === "total",
    ) ?? null
  );
}

export function injectQueueRows(
  table: HTMLTableElement,
  unitIds: string[],
  queueByVillage: Record<number, Record<string, number>>,
): void {
  table.querySelectorAll<HTMLTableSectionElement>("tbody").forEach((tbody) => {
    if (tbody.querySelector(`[${QUEUE_ROW_MARKER}]`)) return;

    const villageId = getVillageId(tbody);
    if (villageId === null) return;

    const totalRow = findTotalRow(tbody);
    const row = buildQueueRow(unitIds, queueByVillage[villageId] ?? {});
    tbody.insertBefore(row, totalRow);

    // a linha "total" era a última coberta pelo rowspan da coluna "Aldeia" —
    // ao entrar antes dela, a "recrutando" toma esse lugar e o "total" vira a
    // 6ª linha física do grupo, ficando de fora do rowspan; sem essa célula
    // vazia, o rótulo "total" desliza pra coluna da aldeia
    if (totalRow) {
      const filler = document.createElement("td");
      filler.setAttribute(TOTAL_FILLER_MARKER, "true");
      totalRow.prepend(filler);
    }
  });
}

function removeQueueRows(table: HTMLTableElement): void {
  table
    .querySelectorAll(`[${QUEUE_ROW_MARKER}], [${TOTAL_FILLER_MARKER}]`)
    .forEach((row) => row.remove());
}

function formatRelativeTime(fetchedAt: number): string {
  const minutes = Math.round((Date.now() - fetchedAt) / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.round(minutes / 60);
  return `há ${hours}h`;
}

function buildToolbar(onRefresh: () => void) {
  const element = document.createElement("div");
  element.className = styles.toolbar;

  const label = document.createElement("span");
  label.className = styles.toolbarLabel;
  label.textContent = "Tropas em recrutamento";

  const status = document.createElement("span");
  status.className = styles.toolbarStatus;

  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = styles.toolbarRefresh;
  refreshButton.textContent = "⟳ atualizar";
  refreshButton.addEventListener("click", onRefresh);

  const spinner = document.createElement("span");
  spinner.className = styles.spinner;
  spinner.setAttribute("aria-hidden", "true");

  element.append(label, status, refreshButton, spinner);

  return {
    element,
    setStatus(text: string) {
      status.textContent = text;
    },
    setLoading(loading: boolean) {
      refreshButton.disabled = loading;
      refreshButton.hidden = loading;
      spinner.classList.toggle(styles.visible, loading);
    },
  };
}

/**
 * Injeta uma linha "em confecção" por aldeia na tabela de tropas da Visão
 * Geral, buscando a fila de recrutamento de cada uma. Só age na tela certa
 * (`screen=overview_villages&mode=units`) — em qualquer outra tela é um
 * no-op. Devolve uma função de limpeza (cancela a espera pela tabela, se
 * ainda não tiver aparecido).
 */
export function initTrainingQueueOverlay(): () => void {
  if (!isUnitsOverviewScreen()) return () => {};

  let cancelled = false;

  waitForElement("#units_table").then(async (element) => {
    if (cancelled) return;
    const table = element as HTMLTableElement;

    const unitIds = getColumnUnitIds(table);

    async function refresh(forceRefresh: boolean) {
      const villageIds = [
        ...table.querySelectorAll<HTMLTableSectionElement>("tbody"),
      ]
        .map(getVillageId)
        .filter((id): id is number => id !== null);

      toolbar.setLoading(true);
      toolbar.setStatus(forceRefresh ? "atualizando..." : "carregando...");

      try {
        const queueByVillage = await getTrainingQueueForVillages(villageIds, {
          forceRefresh,
        });
        removeQueueRows(table);
        injectQueueRows(table, unitIds, queueByVillage);
        const fetchedAt = getTrainingQueueFetchedAt();
        toolbar.setStatus(
          fetchedAt ? `atualizado ${formatRelativeTime(fetchedAt)}` : "",
        );
      } catch (err) {
        console.error("[awesometw] falha ao buscar tropas em confecção", err);
        toolbar.setStatus("falha ao buscar — tenta atualizar de novo");
      } finally {
        toolbar.setLoading(false);
      }
    }

    const toolbar = buildToolbar(() => refresh(true));
    table.before(toolbar.element);

    await refresh(false);
  });

  return () => {
    cancelled = true;
  };
}
