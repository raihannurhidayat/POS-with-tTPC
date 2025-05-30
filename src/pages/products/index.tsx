import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import type { NextPageWithLayout } from "../_app";
import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard";
import { api } from "@/utils/api";
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/shared/product/ProductForm";
import { useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";

const ProductsPage: NextPageWithLayout = () => {

  const apiUtils = api.useUtils()
  const [createDialogIsOpen, setCreateDialogIsOpen] = useState(false)
  const [uploadedCreateImageUrl, setUploadedCreateImageUrl] = useState("")

  const { data: products, isLoading } = api.product.getProducts.useQuery();

  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema)
  })

  const { mutate: createProduct } = api.product.createProduct.useMutation({
    onSuccess: () => {
      apiUtils.product.getProducts.invalidate()
      setCreateDialogIsOpen(false)
      createProductForm.reset()
      toast.success("Berhasil membuat produk", { id: "create-products" })
    }, onMutate: () => {
      toast.loading("Loading...", { id: "create-products" })
    }
  })


  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleSubmitCreateProduct = (values: ProductFormSchema) => {

    if (!uploadedCreateImageUrl) {
      toast.error("Please upload image url!")
      return
    }

    createProduct({
      name: values.name,
      price: values.price,
      categoryId: values.categoryId,
      imageUrl: uploadedCreateImageUrl
    })

    setUploadedCreateImageUrl("")
  }

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>


          <AlertDialog open={createDialogIsOpen} onOpenChange={setCreateDialogIsOpen}>
            <AlertDialogTrigger asChild>
              <Button>Add New Product</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add New Product</AlertDialogTitle>
              </AlertDialogHeader>

              <Form {...createProductForm}>
                <ProductForm onSubmit={handleSubmitCreateProduct} onChangeImageUrl={setUploadedCreateImageUrl} />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={createProductForm.handleSubmit(handleSubmitCreateProduct)}>Add</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <ProductCatalogCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.imageUrl ?? ""}
            category={product.category.name}
            onEdit={() => void 0}
            onDelete={() => void 0}
          />
        ))}
      </div>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
