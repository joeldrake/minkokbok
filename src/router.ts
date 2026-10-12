import { createRouter, createWebHistory } from 'vue-router';
import { scrollBehavior, trackRecipeOrigin } from './navigation';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'list', component: () => import('./views/RecipeListView.vue') },
    { path: '/recept/ny', name: 'new', component: () => import('./views/RecipeEditView.vue') },
    { path: '/recept/importera', name: 'import', component: () => import('./views/ImportView.vue') },
    { path: '/recept/:id', name: 'recipe', component: () => import('./views/RecipeView.vue'), props: true },
    {
      path: '/recept/:id/redigera',
      name: 'edit',
      component: () => import('./views/RecipeEditView.vue'),
      props: true,
    },
    { path: '/admin', name: 'admin', component: () => import('./views/AdminView.vue') },
    { path: '/profil', name: 'profile', component: () => import('./views/ProfileView.vue') },
    { path: '/hitta', name: 'find', component: () => import('./views/FindPeopleView.vue') },
    // Publika sidor ligger sist så att de inte fångar appens egna sökvägar.
    {
      path: '/:username/:slug',
      name: 'publicRecipe',
      component: () => import('./views/RecipeView.vue'),
      props: true,
    },
    {
      path: '/:username',
      name: 'public',
      component: () => import('./views/PublicProfileView.vue'),
      props: true,
    },
  ],
  scrollBehavior,
});

trackRecipeOrigin(router);
