import { db } from '.';

export async function follow(followee: string): Promise<void> {
  if (await db.follows.where('followee').equals(followee).count()) return;
  await db.follows.add({ followee, createdAt: Date.now() });
}

export async function unfollow(followee: string): Promise<void> {
  await db.follows.where('followee').equals(followee).delete();
}

export async function bookmark(recipeId: string): Promise<void> {
  if (await db.bookmarks.where('recipeId').equals(recipeId).count()) return;
  await db.bookmarks.add({ recipeId, createdAt: Date.now() });
}

export async function removeBookmark(recipeId: string): Promise<void> {
  await db.bookmarks.where('recipeId').equals(recipeId).delete();
}
