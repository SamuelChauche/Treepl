import { C } from "../../config/theme";
import { Ic } from "../ui/Icons";
import styles from "./CartToggleButton.module.css";

type State = "default" | "incart" | "published";

interface Props {
  state: State;
  onClick: () => void;
}

/**
 * Reusable cart toggle button with 3 states:
 * - default: round gray + icon
 * - incart: pill "In cart" with peach bg
 * - published: round green check
 */
export function CartToggleButton({ state, onClick }: Props) {
  if (state === "published") {
    return (
      <button className={styles.roundPublished} onClick={onClick}>
        <Ic.Check s={16} c={C.success} />
      </button>
    );
  }

  if (state === "incart") {
    return (
      <button className={styles.pill} onClick={onClick}>
        In cart
      </button>
    );
  }

  return (
    <button className={styles.roundDefault} onClick={onClick}>
      <Ic.Plus s={16} c={C.textSecondary} />
    </button>
  );
}
