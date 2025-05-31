import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  createQRIS,
  xenditPaymentMethodClient,
  xenditPaymentRequestClient,
} from "@/server/xendit";
import { TRPCError } from "@trpc/server";
import { OrderStatus, Prisma } from "@prisma/client";

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(
      z.object({
        orderItems: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { orderItems } = input;

      const products = await db.product.findMany({
        where: {
          id: {
            in: orderItems.map((item) => item.productId),
          },
        },
      });
      let subTotal = 0;
      products.forEach((product) => {
        const productQuantity = orderItems.find(
          (item) => item.productId === product.id,
        )!.quantity;
        const totalPrice = product.price * productQuantity;

        subTotal += totalPrice;
      });

      const tax = subTotal * 0.1;
      const grandTotal = subTotal + tax;

      const order = await db.order.create({
        data: {
          grandtotal: grandTotal,
          tax,
          subtotal: subTotal,
        },
      });

      const orderItem = await db.orderItem.createMany({
        data: products.map((product) => {
          const productQuantity = orderItems.find(
            (item) => item.productId === product.id,
          )!.quantity;

          return {
            orderId: order.id,
            price: product.price,
            productId: product.id,
            quantity: productQuantity,
          };
        }),
      });

      const paymentRequest = await createQRIS({
        amout: grandTotal,
        orderId: order.id,
      });

      await db.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymendMethodiD: paymentRequest.paymentMethod.id,
          externalTransactionId: paymentRequest.id,
        },
      });

      return {
        orderItem,
        order,
        qrString:
          paymentRequest.paymentMethod.qrCode?.channelProperties?.qrString,
      };
    }),

  simulatePayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const order = await db.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          paymendMethodiD: true,
          grandtotal: true,
          externalTransactionId: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "order not found",
        });
      }

      await xenditPaymentMethodClient.simulatePayment({
        paymentMethodId: order.paymendMethodiD!,
        data: {
          amount: order.grandtotal,
        },
      });
    }),

  checkOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          paidAt: true,
        },
      });

      if (!order?.paidAt) {
        return false;
      }

      return true;
    }),

  getOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", ...Object.keys(OrderStatus)]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.OrderWhereInput = {};
      console.log({ status: input.status });
      switch (input.status) {
        case OrderStatus.AWAITING_PAYMENT:
          whereClause.status = OrderStatus.AWAITING_PAYMENT;
          break;
        case OrderStatus.PROCESSING:
          whereClause.status = OrderStatus.PROCESSING;
          break;
        case OrderStatus.DONE:
          whereClause.status = OrderStatus.DONE;
          break;
      }

      console.log({ whereClause });

      const orders = await ctx.db.order.findMany({
        select: {
          id: true,
          grandtotal: true,
          status: true,
          paidAt: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        where: whereClause,
      });

      return orders;
    }),

  finishOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          paidAt: true,
          status: true,
          id: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "order not found",
        });
      }

      if (!order.paidAt) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: "order is not paid yet",
        });
      }

      if (order.status !== OrderStatus.PROCESSING) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message: "order is not processing yet",
        });
      }

      await ctx.db.order.update({
        where: {
          id: input.orderId,
        },
        data: {
          status: OrderStatus.DONE,
        },
      });
    }),

  getSalesReport: protectedProcedure.query(async ({ ctx }) => {
    const paidOrder = await ctx.db.order.findMany({
      where: {
        paidAt: {
          not: null,
        },
      },

      select: {
        grandtotal: true,
      },
    });

    const totalRevenue = paidOrder.reduce((a, b) => {
      return a + b.grandtotal;
    }, 0);

    const onGoingOrder = await ctx.db.order.findMany({
      where: {
        status: {
          not: OrderStatus.DONE,
        },
      },
      select: {
        id: true,
      },
    });

    const totalOngoingOrder = onGoingOrder.length;

    const completedOrder = await ctx.db.order.findMany({
      where: {
        status: OrderStatus.DONE,
      },
      select: {
        id: true,
      },
    });

    const totalCompletedOrder = completedOrder.length;

    return { totalRevenue, totalOngoingOrder, totalCompletedOrder };
  }),
});
