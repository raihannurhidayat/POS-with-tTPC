import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import type { ProductFormSchema } from "@/forms/product";
import { uploadFileToSignedUrl } from "@/lib/supabase";
import { Bucker } from "@/server/bucket";
import { api } from "@/utils/api";
import { useState, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

type ProductFormProps = {
  onSubmit: (values: ProductFormSchema) => void
  onChangeImageUrl: (value: string) => void
}

export const ProductForm = (props: ProductFormProps) => {
  const form = useFormContext<ProductFormSchema>();

  const { data: categories } = api.category.getCategories.useQuery();
  const { mutateAsync: createImageSignedUrl } = api.product.createProductImageUploadSignedUrl.useMutation()

  const imageChangeHandler = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      toast.loading("Loading...", { id: "create-uploaded-image-signed-url" })
      const files = e.target.files
      const { path, token } = await createImageSignedUrl()

      if (files && files?.length > 0) {
        const file = files[0]

        if (!file) return

        const imageUrl = await uploadFileToSignedUrl({
          bucket: Bucker.ProductImages,
          path,
          token,
          file
        })

        props.onChangeImageUrl(imageUrl)
      }
    } catch (error) {
      toast.error("Gagal melakukan upload", { id: "create-uploaded-image-signed-url" })
    } finally {
      toast.success("Berhasil mengupload!", { id: "create-uploaded-image-signed-url" })
    }
  }

  return (
    <form className="space-y-2" onSubmit={form.handleSubmit(props.onSubmit)}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Price</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Price</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={(value: string) => {
                field.onChange(value)
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-1">
        <Label>Product Image</Label>
        <Input type="file" accept="image/*" onChange={imageChangeHandler} />
      </div>
    </form>
  )
}
