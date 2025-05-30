import { PaymentRequest } from "xendit-node"
import { addMinutes } from "date-fns"

export const xenditPaymentRequestClient = new PaymentRequest({
  secretKey: process.env.XENDIT_MONEY_IN_KEY!
})

type CreateQRISParams = {
  amout: number
  orderId: string
}

export const createQRIS = async (params: CreateQRISParams) => {
  const paymentRequest = await xenditPaymentRequestClient.createPaymentRequest({
    data: {
      currency: "IDR",
      amount: params.amout,
      referenceId: params.orderId,
      paymentMethod: {
        reusability: "ONE_TIME_USE",
        type: "QR_CODE",
        qrCode: {
          channelCode: "DANA",
          channelProperties: {
            expiresAt: addMinutes(new Date(), 15)
          }
        },
        referenceId: params.orderId
      }
    }
  })

  return paymentRequest
}