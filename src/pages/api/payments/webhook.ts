import { db } from "@/server/db";
import type { NextApiHandler } from "next";
import { string } from "zod";

type XenditWebhookBody = {
  event: "payment.succeeded";
  data: {
    id: string;
    amount: number;
    payment_request_id: string;
    reference_id: string;
    status: "SUCCEEDED" | "FAILED";
  };
};

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== "POST") return;
  const headers = req.headers;
  const webhookToken = headers["x-callback-token"];

  if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return res.status(422);
  }

  console.log({ body: req.body });
  // VERIFITY

  const body: XenditWebhookBody = req.body;

  const order = await db.order.findUnique({
    where: {
      id: body.data.reference_id,
    },
  });

  if (!order) {
    res.status(404).send("Order not found");
  }

  if (body.data.status !== "SUCCEEDED") {
    res.status(200);
  }

  await db.order.update({
    where: {
      id: order?.id,
    },
    data: {
      paidAt: new Date(),
      status: "PROCESSING",
    },
  });

  res.status(200);
};

export default handler;
