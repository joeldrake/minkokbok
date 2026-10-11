import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'list', component: () => import('./views/RecipeListView.vue') },
    { path: '/recept/ny', name: 'new', component: () => import('./views/RecipeEditView.vue') },
    { path: '/recept/:id', name: 'recipe', component: () => import('./views/RecipeView.vue'), props: true },
    {
      path: '/recept/:id/redigera',
      name: 'edit',
      component: () => import('./views/RecipeEditView.vue'),
      props: true,
    },
    { path: '/profil', name: 'profile', component: () => import('./views/ProfileView.vue') },
    // Publik sida ligger sist så att den inte fångar appens egna sökvägar.
    {
      path: '/:username',
      name: 'public',
      component: () => import('./views/PublicProfileView.vue'),
      props: true,
    },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
});
