import { C } from "../../config/theme";
import { Spark } from "../ui/Spark";
import { Ic } from "../ui/Icons";
import type { Web3Topic, Web3Category } from "../../types";
import type { TopicVaultData } from "../../services/trendingService";
import styles from "./TopicCard.module.css";

type VoteState = "support" | "pending" | "supported" | "redeem" | "redeeming";

interface Props {
  topic: Web3Topic;
  category?: Web3Category;
  realData?: TopicVaultData;
  mockVoteCount: number;
  chartData: number[];
  voteState: VoteState;
  voteLabel: string;
  onVoteClick: () => void;
}

const ICON_EMOJI: Record<string, string> = {
  "chart-line": "📊", image: "🖼️", layers: "🔗", shield: "🔒", brain: "🤖",
  lock: "🛡️", users: "🏛️", wrench: "🛠️", "dollar-sign": "💲", building: "🏠",
  gamepad: "🎮", fingerprint: "👤", cube: "⚙️", server: "🥩", link: "🌐",
  gavel: "⚖️", fire: "🔥", "bar-chart": "📈", leaf: "🌿", rocket: "🚀",
};

function formatTrust(wei: string): string {
  const val = Number(BigInt(wei)) / 1e18;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(3);
  if (val > 0) return val.toFixed(4);
  return "0";
}

function getVoteBtnStyle(state: VoteState): React.CSSProperties {
  if (state === "support" || state === "supported") {
    return { background: state === "supported" ? C.successLight : C.surfaceGray };
  }
  return {
    background: state === "pending" ? C.flatLight : C.errorLight,
    color: state === "pending" ? C.flat : C.error,
    opacity: state === "redeeming" ? 0.5 : 1,
    cursor: state === "redeeming" ? "wait" : "pointer",
  };
}

export function TopicCard({ topic, category, realData, mockVoteCount, chartData, voteState, voteLabel, onVoteClick }: Props) {
  const emoji = ICON_EMOJI[category?.icon ?? ""] ?? "📌";
  const count = realData ? realData.supportCount : mockVoteCount;
  const trustLabel = realData && BigInt(realData.supportAssets) > 0n ? ` · ${formatTrust(realData.supportAssets)} TRUST` : "";
  const isRound = voteState === "support" || voteState === "supported";

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.icon} style={{ background: category ? `${category.color}22` : C.primaryLight }}>
          {emoji}
        </div>
        <div className={styles.info}>
          <div className={styles.name}>{topic.name}</div>
          <div className={styles.meta}>{category?.name ?? "Other"} &middot; {count} votes{trustLabel}</div>
        </div>
      </div>
      <div className={styles.bottomRow}>
        <div className={styles.sparkWrap}>
          <Spark data={chartData} color={category?.color ?? C.primary} h={28} />
        </div>
        <button
          className={isRound ? styles.voteBtnRound : styles.voteBtnPill}
          style={getVoteBtnStyle(voteState)}
          onClick={onVoteClick}
          disabled={voteState === "redeeming"}
        >
          {voteState === "support" ? (
            <Ic.Plus s={16} c={C.textSecondary} />
          ) : voteState === "supported" ? (
            <Ic.Check s={16} c={C.success} />
          ) : (
            voteLabel
          )}
        </button>
      </div>
    </div>
  );
}
