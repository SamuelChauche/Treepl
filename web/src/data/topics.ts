import topicsJson from "../../../bdd/web3_topics.json";
import type { Web3Category, Web3Topic, Web3TopicsData } from "../types";

const data = topicsJson as Web3TopicsData;

export const categories: Web3Category[] = data.categories;
export const allTopics: Web3Topic[] = data.categories.flatMap((c) =>
  c.topics.map((t) => ({ ...t, categoryId: c.id }))
);
export const categoryMap = new Map(categories.map((c) => [c.id, c]));
