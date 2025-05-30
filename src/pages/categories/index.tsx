import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { CategoryCatalogCard } from "@/components/shared/category/CategoryCatalogCard";
import { CategoryForm } from "@/components/shared/category/CategoryForm";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { categoryFormSchema, type CategoryFormSchema } from "@/forms/category";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactElement } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { NextPageWithLayout } from "../_app";
import { api } from "@/utils/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CategoriesPage: NextPageWithLayout = () => {

  const apiUtils = api.useUtils()

  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] =
    useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<{ id: string, name: string } | null>(null);

  const createCategoryForm = useForm<CategoryFormSchema>({
    resolver: zodResolver(categoryFormSchema),
  });

  const editCategoryForm = useForm<CategoryFormSchema>({
    resolver: zodResolver(categoryFormSchema),
  });

  const { data: categories, isLoading: categoriesIsLoading } = api.category.getCategories.useQuery();
  const { mutate: createCategory } = api.category.createCategory.useMutation({
    onSuccess: async () => {
      await apiUtils.category.getCategories.invalidate()

      alert("Category created successfully");
      setCreateCategoryDialogOpen(false);
      createCategoryForm.reset();
    }
  });

  const { mutate: deleteCategoryById } = api.category.deleteCategory.useMutation({
    onSuccess: async () => {
      await apiUtils.category.getCategories.invalidate()
      setCategoryToDelete(null)
      toast.success("Berhasil Menghapus.", { id: "delete-category" })
    }, onMutate: () => {
      toast.loading("loading...", { id: "delete-category" })
    }
  });

  const { mutate: updateCategoryById } = api.category.updateCategory.useMutation({
    onSuccess: async () => {
      await apiUtils.category.getCategories.invalidate()
      setCategoryToEdit(null)
      setEditCategoryDialogOpen(false)
      alert("Category updated successfully");
      editCategoryForm.reset();
    }
  });


  const handleSubmitCreateCategory = (data: CategoryFormSchema) => {
    createCategory({
      name: data.name,
    });
  };

  const handleSubmitEditCategory = (data: CategoryFormSchema) => {

    if (!categoryToEdit) return;

    updateCategoryById({
      id: categoryToEdit.id,
      name: data.name,
    });
  };

  const handleClickEditCategory = (category: { id: string, name: string }) => {
    setEditCategoryDialogOpen(true);
    setCategoryToEdit({ id: category.id, name: category.name })
    editCategoryForm.reset({
      name: category.name,
    });
  };

  const handleClickDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
  };

  const handleConfirmDeleteCategory = () => {

    if (!categoryToDelete) return;

    deleteCategoryById({
      id: categoryToDelete,
    });

  }

  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Category Management</DashboardTitle>
            <DashboardDescription>
              Organize your products with custom categories.
            </DashboardDescription>
          </div>

          <AlertDialog
            open={createCategoryDialogOpen}
            onOpenChange={setCreateCategoryDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button>Add New Category</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add New Category</AlertDialogTitle>
              </AlertDialogHeader>
              <Form {...createCategoryForm}>
                <CategoryForm
                  onSubmit={handleSubmitCreateCategory}
                  submitText="Create Category"
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  onClick={createCategoryForm.handleSubmit(
                    handleSubmitCreateCategory,
                  )}
                >
                  Create Category
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categoriesIsLoading ? (
          <div className="w-[250px] h-[190px] bg-slate-100/60 rounded-md border-[0.3px] shadow-md animate-pulse flex items-center justify-center" >
            <Loader2 className="w-12 h-12 animate-spin" />
          </div>
        ) : (
          categories?.map((category) => (
            <CategoryCatalogCard key={category.id} name={category.name} productCount={category.productCount} onDelete={() => handleClickDeleteCategory(category.id)} onEdit={() => handleClickEditCategory({ id: category.id, name: category.name })} />
          ))
        )}


      </div>

      <AlertDialog
        open={editCategoryDialogOpen}
        onOpenChange={setEditCategoryDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Category</AlertDialogTitle>
          </AlertDialogHeader>
          <Form {...editCategoryForm}>
            <CategoryForm
              onSubmit={handleSubmitEditCategory}
              submitText="Edit Category"
            />
          </Form>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={editCategoryForm.handleSubmit(handleSubmitEditCategory)}
            >
              Edit Category
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDeleteCategory}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

CategoriesPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default CategoriesPage;
