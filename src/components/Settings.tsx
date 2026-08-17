import { useEffect, useState } from "react";
import styles from "./Settings.module.css";
import { formatShortcut, isMac, type ShortcutConfig } from "../lib/shortcut";

const MODIFIER_CODES = new Set([
  "ControlLeft",
  "ControlRight",
  "MetaLeft",
  "MetaRight",
  "ShiftLeft",
  "ShiftRight",
  "AltLeft",
  "AltRight",
]);

type SettingsProps = {
  shortcut: ShortcutConfig;
  onChangeShortcut: (next: ShortcutConfig) => void;
  onBack: () => void;
};

export function Settings({
  shortcut,
  onChangeShortcut,
  onBack,
}: SettingsProps) {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isRecording) {
        if (MODIFIER_CODES.has(event.code)) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.code === "Escape") {
          setIsRecording(false);
          return;
        }

        onChangeShortcut({
          mod: event.ctrlKey || event.metaKey,
          shift: event.shiftKey,
          alt: event.altKey,
          code: event.code,
        });
        setIsRecording(false);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onBack();
      }
    }

    // capture: true garante que a gente intercepta antes do listener de Esc do Modal
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isRecording, onBack, onChangeShortcut]);

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.sectionTitle}>ATALHOS</h3>

      <div className={styles.row}>
        <span>Abrir AwesomeTW</span>
        <div className={styles.shortcutControls}>
          <span className={styles.chip}>
            {isRecording ? "PRESSIONE UMA TECLA…" : formatShortcut(shortcut)}
          </span>
          <button
            type="button"
            className={styles.recordButton}
            onClick={() => setIsRecording((value) => !value)}
          >
            {isRecording ? "cancelar" : "alterar"}
          </button>
        </div>
      </div>

      {isMac && (
        <p className={styles.hint}>
          No macOS, ⌘+Espaço costuma ser interceptado pelo Spotlight antes de
          chegar no navegador. Se o atalho padrão não funcionar, tenta trocar
          aqui pra outra combinação.
        </p>
      )}
    </div>
  );
}
