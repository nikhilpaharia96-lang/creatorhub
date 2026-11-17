import { env } from "./config/env";
import { createApp } from "./app";

const app = createApp();

app.listen(Number(env.PORT), () => {
  console.log(`CreatorHub API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
