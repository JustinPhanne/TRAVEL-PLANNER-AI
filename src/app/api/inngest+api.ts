import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import {
  deleteUserFromClerk,
  generateTrip,
  syncUserFromClerk,
  updateUserFromClerk,
} from "@/inngest/functions";

const handler = serve({
  client: inngest,
  functions: [syncUserFromClerk, updateUserFromClerk, deleteUserFromClerk, generateTrip],
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
