import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", name: "title", component: () => import("./views/TitleView.vue") },
  { path: "/home", name: "home", component: () => import("./views/HomeView.vue") },
  { path: "/stages", name: "stages", component: () => import("./views/StageSelectView.vue") },
  { path: "/battle/:stageId", name: "battle", component: () => import("./views/BattleView.vue"), props: true },
  { path: "/party", name: "party", component: () => import("./views/PartyView.vue") },
  { path: "/dex", name: "dex", component: () => import("./views/DexView.vue") },
  { path: "/shop", name: "shop", component: () => import("./views/ShopView.vue") },
  { path: "/character/:uid", name: "character", component: () => import("./views/CharacterDetail.vue"), props: true },
];

export const router = createRouter({
  // Hash history works on GitHub Pages without server-side rewrites.
  history: createWebHashHistory(),
  routes,
});
