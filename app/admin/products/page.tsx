"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/admin/admin-guard";
import AdminNav from "@/components/admin/admin-nav";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import {
  createDoorCategory,
  createDoorProductWithTiers,
  fetchAdminCatalogData,
  uploadDoorProductImages,
} from "@/services/admin/products.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type {
  CatalogProduct,
  DoorCategory,
  DoorDeliveryTier,
} from "@/types/domain";
import { formatMoney, toSlug } from "@/utils/formatters";

interface TierDraft {
  id: number;
  min_quantity: number;
  max_quantity: number | null;
  delivery_days: number;
}

function createTierDraft(id: number): TierDraft {
  return {
    id,
    min_quantity: 1,
    max_quantity: null,
    delivery_days: 7,
  };
}

export default function AdminProductsPage() {
  const supabaseConfigured = isSupabaseConfigured();

  const [categories, setCategories] = useState<DoorCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("0");
  const [baseHeightCm, setBaseHeightCm] = useState("180");
  const [baseWidthCm, setBaseWidthCm] = useState("100");
  const [extraHeightPrice, setExtraHeightPrice] = useState("0");
  const [extraWidthPrice, setExtraWidthPrice] = useState("0");
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [tiers, setTiers] = useState<TierDraft[]>([createTierDraft(1)]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!supabaseConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await fetchAdminCatalogData();
    if (result.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
      return;
    }

    if (!result.data) {
      setErrorMessage("Catalog response is empty.");
      setIsLoading(false);
      return;
    }

    setCategories(result.data.categories);
    setProducts(result.data.products);
    if (!productCategoryId && result.data.categories.length) {
      setProductCategoryId(result.data.categories[0].id);
    }
    setIsLoading(false);
  }, [productCategoryId, supabaseConfigured]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!supabaseConfigured) return;

    setIsSubmitting(true);
    const normalizedSlug = toSlug(categorySlug || categoryName);
    const result = await createDoorCategory({
      name: categoryName.trim(),
      slug: normalizedSlug,
      description: categoryDescription.trim() || null,
    });

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    setCategoryName("");
    setCategorySlug("");
    setCategoryDescription("");
    setSuccessMessage("Category created.");
    await loadData();
  }

  function updateTier(
    id: number,
    key: keyof Omit<TierDraft, "id">,
    value: number | null,
  ) {
    setTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, [key]: value } : tier)),
    );
  }

  function addProductImageFiles(incoming: FileList | null) {
    if (!incoming?.length) {
      return;
    }

    const nextFiles = Array.from(incoming).filter((file) =>
      file.type.startsWith("image/"),
    );

    setProductImageFiles((prev) => [...prev, ...nextFiles].slice(0, 12));
  }

  function removeProductImageFile(fileName: string, index: number) {
    setProductImageFiles((prev) =>
      prev.filter(
        (item, itemIndex) => !(item.name === fileName && itemIndex === index),
      ),
    );
  }

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!supabaseConfigured) return;
    if (!productCategoryId) {
      setErrorMessage("Please create/select a category first.");
      return;
    }

    setIsSubmitting(true);
    const normalizedSlug = toSlug(productSlug || productName);
    const result = await createDoorProductWithTiers({
      category_id: productCategoryId,
      name: productName.trim(),
      slug: normalizedSlug,
      description: productDescription.trim() || null,
      base_price: Number(basePrice),
      base_height_cm: Number(baseHeightCm),
      base_width_cm: Number(baseWidthCm),
      price_per_extra_cm_height: Number(extraHeightPrice),
      price_per_extra_cm_width: Number(extraWidthPrice),
      thumbnail_url: null,
      delivery_tiers: tiers.map((tier) => ({
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        delivery_days: tier.delivery_days,
      })),
    });

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    if (!result.data) {
      setErrorMessage("Product response is empty.");
      return;
    }

    if (productImageFiles.length > 0) {
      const uploadResult = await uploadDoorProductImages({
        productId: result.data.id,
        productSlug: normalizedSlug,
        files: productImageFiles,
      });

      if (uploadResult.error) {
        setErrorMessage(
          `Product created, but images upload failed: ${uploadResult.error}`,
        );
        await loadData();
        return;
      }
    }

    setProductName("");
    setProductSlug("");
    setProductDescription("");
    setBasePrice("0");
    setBaseHeightCm("180");
    setBaseWidthCm("100");
    setExtraHeightPrice("0");
    setExtraWidthPrice("0");
    setProductImageFiles([]);
    setTiers([createTierDraft(1)]);
    setSuccessMessage(
      productImageFiles.length
        ? "Product, delivery tiers, and images created."
        : "Product and delivery tiers created.",
    );
    await loadData();
  }

  return (
    <AdminGuard>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminNav />
        {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {successMessage ? (
          <Alert severity="success">{successMessage}</Alert>
        ) : null}

        {isLoading ? (
          <Box
            sx={{
              minHeight: 220,
              display: "grid",
              placeItems: "center",
              mt: 2,
            }}
          >
            <CircularProgress />
          </Box>
        ) : null}

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                component="form"
                spacing={1.5}
                onSubmit={handleCreateCategory}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Add Category
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 2fr auto" },
                  }}
                >
                  <TextField
                    label="Name"
                    value={categoryName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCategoryName(value);
                      if (!categorySlug) {
                        setCategorySlug(toSlug(value));
                      }
                    }}
                    required
                  />
                  <TextField
                    label="Slug"
                    value={categorySlug}
                    onChange={(event) =>
                      setCategorySlug(toSlug(event.target.value))
                    }
                    required
                  />
                  <TextField
                    label="Description"
                    value={categoryDescription}
                    onChange={(event) =>
                      setCategoryDescription(event.target.value)
                    }
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack
                component="form"
                spacing={1.5}
                onSubmit={handleCreateProduct}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Add Product
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(3, minmax(0, 1fr))",
                    },
                  }}
                >
                  <TextField
                    select
                    label="Category"
                    value={productCategoryId}
                    onChange={(event) =>
                      setProductCategoryId(event.target.value)
                    }
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Name"
                    value={productName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setProductName(value);
                      if (!productSlug) {
                        setProductSlug(toSlug(value));
                      }
                    }}
                    required
                  />
                  <TextField
                    label="Slug"
                    value={productSlug}
                    onChange={(event) =>
                      setProductSlug(toSlug(event.target.value))
                    }
                    required
                  />
                  <TextField
                    label="Base price"
                    type="number"
                    value={basePrice}
                    onChange={(event) => setBasePrice(event.target.value)}
                    required
                  />
                  <TextField
                    label="Base height (cm)"
                    type="number"
                    value={baseHeightCm}
                    onChange={(event) => setBaseHeightCm(event.target.value)}
                    required
                  />
                  <TextField
                    label="Base width (cm)"
                    type="number"
                    value={baseWidthCm}
                    onChange={(event) => setBaseWidthCm(event.target.value)}
                    required
                  />
                  <TextField
                    label="Extra price per cm height"
                    type="number"
                    value={extraHeightPrice}
                    onChange={(event) =>
                      setExtraHeightPrice(event.target.value)
                    }
                    required
                  />
                  <TextField
                    label="Extra price per cm width"
                    type="number"
                    value={extraWidthPrice}
                    onChange={(event) => setExtraWidthPrice(event.target.value)}
                    required
                  />
                  <TextField
                    label="Description"
                    value={productDescription}
                    onChange={(event) =>
                      setProductDescription(event.target.value)
                    }
                    multiline
                    minRows={2}
                    sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
                  />
                </Box>

                <Stack spacing={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Product images (multiple upload)
                  </Typography>
                  <Button variant="outlined" component="label">
                    Select images
                    <input
                      hidden
                      multiple
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        addProductImageFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Up to 12 images, displayed as swipeable timed carousel.
                  </Typography>
                  {productImageFiles.length ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {productImageFiles.map((file, index) => (
                        <Chip
                          key={`${file.name}-${index}`}
                          label={file.name}
                          onDelete={() =>
                            removeProductImageFile(file.name, index)
                          }
                        />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>

                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Delivery tiers (quantity to days)
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      size="small"
                      onClick={() =>
                        setTiers((prev) => [
                          ...prev,
                          createTierDraft(prev[prev.length - 1].id + 1),
                        ])
                      }
                    >
                      Add tier
                    </Button>
                  </Stack>

                  {tiers.map((tier) => (
                    <Box
                      key={tier.id}
                      sx={{
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: {
                          xs: "1fr 1fr",
                          md: "repeat(4, minmax(0, 1fr)) auto",
                        },
                        alignItems: "center",
                      }}
                    >
                      <TextField
                        label="Min qty"
                        type="number"
                        value={tier.min_quantity}
                        onChange={(event) =>
                          updateTier(
                            tier.id,
                            "min_quantity",
                            Math.max(1, Number(event.target.value)),
                          )
                        }
                      />
                      <TextField
                        label="Max qty (blank = no max)"
                        type="number"
                        value={tier.max_quantity ?? ""}
                        onChange={(event) =>
                          updateTier(
                            tier.id,
                            "max_quantity",
                            event.target.value === ""
                              ? null
                              : Math.max(1, Number(event.target.value)),
                          )
                        }
                      />
                      <TextField
                        label="Delivery days"
                        type="number"
                        value={tier.delivery_days}
                        onChange={(event) =>
                          updateTier(
                            tier.id,
                            "delivery_days",
                            Math.max(1, Number(event.target.value)),
                          )
                        }
                      />
                      <Button
                        color="error"
                        onClick={() =>
                          setTiers((prev) =>
                            prev.length === 1
                              ? prev
                              : prev.filter((item) => item.id !== tier.id),
                          )
                        }
                        startIcon={<DeleteIcon />}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                >
                  {isSubmitting ? "Saving..." : "Save product"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                Existing Products
              </Typography>
              <Stack spacing={1}>
                {products.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      {product.name} ({product.slug})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {product.door_categories?.name ?? "Unknown"}
                    </Typography>
                    <Typography variant="body2">
                      Base: {formatMoney(product.base_price)} at{" "}
                      {product.base_height_cm}cm x {product.base_width_cm}cm
                    </Typography>
                    <Typography variant="body2">
                      Extra height:{" "}
                      {formatMoney(product.price_per_extra_cm_height)} / cm,
                      extra width:{" "}
                      {formatMoney(product.price_per_extra_cm_width)} / cm
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Images: {product.door_product_images?.length ?? 0}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      {(
                        (product.door_delivery_tiers ??
                          []) as DoorDeliveryTier[]
                      ).map((tier) => (
                        <Typography
                          key={tier.id}
                          variant="caption"
                          color="text.secondary"
                        >
                          Qty {tier.min_quantity} to{" "}
                          {tier.max_quantity ?? "no max"}: {tier.delivery_days}{" "}
                          day(s)
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </AdminGuard>
  );
}
