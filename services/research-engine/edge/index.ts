import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  BACKEND: DurableObjectNamespace<Backend>;
  DATABASE_URL: string;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  GOOGLE_CLIENT_ID: string;
  JWT_SECRET: string;
  CORS_ORIGINS: string;
}

export class Backend extends Container<Env> {
  defaultPort = 8000;
  sleepAfter = "10m";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.envVars = {
      DATABASE_URL: env.DATABASE_URL,
      GROQ_API_KEY: env.GROQ_API_KEY,
      GROQ_MODEL: env.GROQ_MODEL,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      JWT_SECRET: env.JWT_SECRET,
      CORS_ORIGINS: env.CORS_ORIGINS,
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.BACKEND).fetch(request);
  },
};