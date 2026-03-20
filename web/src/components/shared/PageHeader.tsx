import { useNavigate } from "react-router-dom";
import { Ic } from "../ui/Icons";
import { C } from "../../config/theme";
import styles from "./PageHeader.module.css";

interface Props {
  title: string;
  /** Right-side action slot */
  action?: React.ReactNode;
  /** Override back behavior (default: navigate(-1)) */
  onBack?: () => void;
}

export function PageHeader({ title, action, onBack }: Props) {
  const navigate = useNavigate();

  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack ?? (() => navigate(-1))}>
        <Ic.Back s={22} c={C.textPrimary} />
      </button>
      <span className={styles.title}>{title}</span>
      {action ?? <div className={styles.spacer} />}
    </div>
  );
}
