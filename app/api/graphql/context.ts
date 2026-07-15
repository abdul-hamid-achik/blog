import { User } from "@/lib/auth";
import type { NextRequest } from "next/server";

export interface Context {
  req: NextRequest;
  locale: string;
  user: User;
}
