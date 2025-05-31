import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { OrderCard, type Order } from "@/components/OrderCard";
import type { NextPageWithLayout } from "../_app";
import type { ReactElement } from "react";
import { useState } from "react";
import { api } from "@/utils/api";
import { OrderStatus } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { toRupiah } from "@/utils/toRupiah";

const SalesPage: NextPageWithLayout = () => {
  // const [orders, setOrders] = useState<Order[]>([
  //   {
  //     id: "ORD-001",
  //     totalAmount: 45.99,
  //     totalItems: 3,
  //     status: "Processing"
  //   },
  //   {
  //     id: "ORD-002",
  //     totalAmount: 23.50,
  //     totalItems: 2,
  //     status: "Finished"
  //   },
  //   {
  //     id: "ORD-003",
  //     totalAmount: 67.25,
  //     totalItems: 5,
  //     status: "Processing"
  //   },
  //   {
  //     id: "ORD-004",
  //     totalAmount: 12.99,
  //     totalItems: 1,
  //     status: "Finished"
  //   },
  //   {
  //     id: "ORD-005",
  //     totalAmount: 89.75,
  //     totalItems: 7,
  //     status: "Processing"
  //   },
  //   {
  //     id: "ORD-006",
  //     totalAmount: 34.20,
  //     totalItems: 4,
  //     status: "Finished"
  //   }
  // ]);
  const apiUtils = api.useUtils();
  const [filterOrder, setFilterOrder] = useState<OrderStatus | "all">("all");
  const { data: orders } = api.order.getOrders.useQuery({
    status: filterOrder,
  });

  const { mutate: finishOrder, isPending: finishOrderIsPending } =
    api.order.finishOrderStatus.useMutation({
      onSuccess: () => {
        toast.success("Berhasil ");
        apiUtils.order.getOrders.invalidate();
      },
    });

  const { data: salesReport } = api.order.getSalesReport.useQuery();

  const handleFinishOrder = (orderId: string) => {
    finishOrder({
      orderId: orderId,
    });
  };

  const handleFilterOrderChange = (value: OrderStatus) => {
    console.log({ value });
    setFilterOrder(value);
  };

  return (
    <>
      <DashboardHeader>
        <DashboardTitle>Sales Dashboard</DashboardTitle>
        <DashboardDescription>
          Track your sales performance and view analytics.
        </DashboardDescription>
      </DashboardHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold">
            {toRupiah(salesReport?.totalRevenue!) ?? "0"}
          </p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Ongoing Orders</h3>
          <p className="mt-2 text-3xl font-bold">
            {salesReport?.totalOngoingOrder}
          </p>
        </div>

        <div className="rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-medium">Completed Orders</h3>
          <p className="mt-2 text-3xl font-bold">
            {salesReport?.totalCompletedOrder}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-medium">Orders</h3>

        <div className="rounded-lg border p-6">
          <div className="flex justify-between">
            <h4 className="mb-4 text-lg font-medium">Orders</h4>
            <Select
              defaultValue="all"
              value={filterOrder}
              onValueChange={handleFilterOrderChange}
            >
              <SelectTrigger>
                <SelectValue defaultValue={"all"} />
              </SelectTrigger>
              <SelectContent align="end">
                {Object.keys(OrderStatus).map((orderStatus) => {
                  return (
                    <SelectItem value={orderStatus} key={orderStatus}>
                      {OrderStatus[orderStatus as keyof typeof OrderStatus]}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders?.map((order) => (
            <OrderCard
              key={order.id}
              id={order.id}
              totalItems={order._count.orderItems}
              status={order.status}
              totalAmount={order.grandtotal}
              onFinishOrder={handleFinishOrder}
            />
          ))}
        </div>
      </div>
    </>
  );
};

SalesPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SalesPage;
