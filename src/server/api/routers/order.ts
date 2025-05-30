import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createQRIS } from "@/server/xendit";

export const orderRouter = createTRPCRouter({
  createOrder: protectedProcedure.input(z.object({
    orderItems: z.array(z.object({
      productId: z.string(),
      quantity: z.number().min(1)
    }))
  })).mutation(async ({ ctx, input }) => {
    const { db } = ctx
    const { orderItems } = input

    const products = await db.product.findMany({
      where: {
        id: {
          in: orderItems.map((item) => item.productId)
        }
      }
    });
    let subTotal = 0;
    products.forEach(product => {
      const productQuantity = orderItems.find(item => item.productId === product.id)!.quantity;
      const totalPrice = product.price * productQuantity;

      subTotal += totalPrice
    })

    const tax = subTotal * 0.10
    const grandTotal = subTotal + tax

    const order = await db.order.create({
      data: {
        grandtotal: grandTotal,
        tax,
        subtotal: subTotal
      }
    })

    const orderItem = await db.orderItem.createMany({
      data: products.map((product) => {
        const productQuantity = orderItems.find(item => item.productId === product.id)!.quantity;


        return {
          orderId: order.id,
          price: product.price,
          productId: product.id,
          quantity: productQuantity
        }
      })
    })

    const paymentRequest = await createQRIS({
      amout: grandTotal,
      orderId: order.id
    })

    await db.order.update({
      where: {
        id: order.id
      }, data: {
        paymendMethodiD: paymentRequest.paymentMethod.id,
        externalTransactionId: paymentRequest.id
      }
    })

    return { orderItem, order, qrString: paymentRequest.paymentMethod.qrCode?.channelProperties?.qrString }
  })
})