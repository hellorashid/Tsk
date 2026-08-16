import { createBasic } from "@basictech/react";
import { schema } from "../basic.config";

export { schema };

const DEFAULT_CLIENT_ID = "did:web:tsk.lol";

export const basic = createBasic({
  schema,
  clientId: import.meta.env.VITE_BASIC_CLIENT_ID || DEFAULT_CLIENT_ID,
  debug: import.meta.env.DEV,
});
