import { Elysia } from "elysia";
import { auth } from './modules/auth'
import { book } from './modules/book'

const app = new Elysia()
  .use(auth)
  .use(book)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
