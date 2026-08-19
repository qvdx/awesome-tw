import { useEffect, useState } from "react";
import styles from "./Utilities.module.css";
import { Menu, type MenuItem } from "./Menu";
import { VillageMapping } from "./VillageMapping";

type UtilitiesProps = {
  onBack: () => void;
};

type UtilitiesScreen = "menu" | "mapping";

export function Utilities({ onBack }: UtilitiesProps) {
  const [screen, setScreen] = useState<UtilitiesScreen>("menu");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // enquanto uma tela aninhada estiver aberta, o Esc dela é quem manda
      if (screen !== "menu") return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onBack();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onBack, screen]);

  if (screen === "mapping") {
    return <VillageMapping onBack={() => setScreen("menu")} />;
  }

  const items: MenuItem[] = [
    {
      label: "Mapeamento de aldeias bárbaras e bônus",
      onSelect: () => setScreen("mapping"),
    },
  ];

  return (
    <div>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ voltar
      </button>

      <h3 className={styles.title}>UTILITÁRIOS</h3>

      <Menu items={items} />
    </div>
  );
}
