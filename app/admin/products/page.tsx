"use client";

import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import HeightIcon from "@mui/icons-material/Height";
import LinkIcon from "@mui/icons-material/Link";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SaveIcon from "@mui/icons-material/Save";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import CatalogProductRow from "@/components/admin/catalog-product-row";
import EditProductDialog from "@/components/admin/edit-product-dialog";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import {
  createDoorCategory,
  createDoorProductWithTiers,
  deleteDoorProduct,
  fetchAdminCatalogData,
  uploadDoorProductImages,
} from "@/services/admin/products.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { TierDraft } from "@/types/admin";
import type { CatalogProduct, DoorCategory } from "@/types/domain";
import { toSlug } from "@/utils/formatters";

function createTierDraft(id: number): TierDraft {
  return {
    id,
    min_quantity: 1,
    max_quantity: null,
    delivery_days: 7,
  };
}

function parsePositiveIntegerFromInput(
  value: string,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function parseNonNegativeNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
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

  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogProduct | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "category" | "product" | "catalog"
  >("category");

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

    const trimmedName = categoryName.trim();
    const normalizedSlug = toSlug(categorySlug || categoryName);
    if (!trimmedName) {
      setErrorMessage("ERR_CATEGORY_NAME_REQUIRED: Category name is required.");
      return;
    }
    if (!normalizedSlug) {
      setErrorMessage("ERR_CATEGORY_SLUG_REQUIRED: Category slug is required.");
      return;
    }

    setIsSubmitting(true);
    const result = await createDoorCategory({
      name: trimmedName,
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
      setErrorMessage(
        "ERR_PRODUCT_CATEGORY_REQUIRED: Select a category first.",
      );
      return;
    }

    const trimmedName = productName.trim();
    const normalizedSlug = toSlug(productSlug || productName);
    if (!trimmedName) {
      setErrorMessage("ERR_PRODUCT_NAME_REQUIRED: Product name is required.");
      return;
    }
    if (!normalizedSlug) {
      setErrorMessage("ERR_PRODUCT_SLUG_REQUIRED: Product slug is required.");
      return;
    }

    const parsedBasePrice = parseNonNegativeNumber(basePrice);
    const parsedBaseHeight = parseNonNegativeNumber(baseHeightCm);
    const parsedBaseWidth = parseNonNegativeNumber(baseWidthCm);
    const parsedExtraHeight = parseNonNegativeNumber(extraHeightPrice);
    const parsedExtraWidth = parseNonNegativeNumber(extraWidthPrice);
    if (
      parsedBasePrice === null ||
      parsedBaseHeight === null ||
      parsedBaseWidth === null ||
      parsedExtraHeight === null ||
      parsedExtraWidth === null ||
      parsedBaseHeight === 0 ||
      parsedBaseWidth === 0
    ) {
      setErrorMessage(
        "ERR_PRODUCT_NUMERIC_FIELDS_INVALID: Check pricing and dimensions.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await createDoorProductWithTiers({
      category_id: productCategoryId,
      name: trimmedName,
      slug: normalizedSlug,
      description: productDescription.trim() || null,
      base_price: parsedBasePrice,
      base_height_cm: parsedBaseHeight,
      base_width_cm: parsedBaseWidth,
      price_per_extra_cm_height: parsedExtraHeight,
      price_per_extra_cm_width: parsedExtraWidth,
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

  async function confirmDeleteProduct() {
    if (!deleteTarget || !supabaseConfigured) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setDeleteSubmitting(true);

    const result = await deleteDoorProduct(deleteTarget.id);
    setDeleteSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      setDeleteTarget(null);
      return;
    }

    setSuccessMessage(`"${deleteTarget.name}" was deleted.`);
    setDeleteTarget(null);
    await loadData();
  }

  return (
    <>
      {!supabaseConfigured ? <SupabaseConfigAlert /> : null}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Manrope", sans-serif',
            fontWeight: 800,
            mb: 1,
            color: "var(--on-surface)",
          }}
        >
          Catalog Management
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--on-surface-variant)",
            fontSize: "0.875rem",
          }}
        >
          Create categories, add products, set pricing, configure delivery
          tiers, and upload images.
        </Typography>
      </Box>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      ) : null}

      {!isLoading ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: 3 }}
          useFlexGap
        >
          <Button
            variant={activeSection === "category" ? "contained" : "outlined"}
            onClick={() => setActiveSection("category")}
          >
            Create Category
          </Button>
          <Button
            variant={activeSection === "product" ? "contained" : "outlined"}
            onClick={() => setActiveSection("product")}
          >
            Add Product
          </Button>
          <Button
            variant={activeSection === "catalog" ? "contained" : "outlined"}
            onClick={() => setActiveSection("catalog")}
          >
            Catalog
          </Button>
        </Stack>
      ) : null}

      {isLoading ? (
        <Box
          sx={{
            minHeight: 400,
            display: "grid",
            placeItems: "center",
            mt: 2,
          }}
        >
          <CircularProgress />
        </Box>
      ) : null}

      {!isLoading && (
        <Stack spacing={4}>
          {/* Category Section */}
          <Card
            variant="outlined"
            sx={{
              borderColor: "var(--outline-variant)",
              display: activeSection === "category" ? "block" : "none",
            }}
          >
            <CardContent>
              <Stack
                component="form"
                spacing={2}
                onSubmit={handleCreateCategory}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    Create Category
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--on-surface-variant)",
                      fontSize: "0.75rem",
                    }}
                  >
                    Add a new product category to organize your catalog
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(3, 1fr) auto",
                    },
                  }}
                >
                  <TextField
                    label="Category Name"
                    value={categoryName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setCategoryName(value);
                      if (!categorySlug) {
                        setCategorySlug(toSlug(value));
                      }
                    }}
                    size="small"
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CategoryIcon sx={{ fontSize: "1.25rem" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Slug"
                    value={categorySlug}
                    onChange={(event) =>
                      setCategorySlug(toSlug(event.target.value))
                    }
                    size="small"
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon sx={{ fontSize: "1.25rem" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Description"
                    value={categoryDescription}
                    onChange={(event) =>
                      setCategoryDescription(event.target.value)
                    }
                    size="small"
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <DescriptionIcon sx={{ fontSize: "1.25rem" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                    sx={{ alignSelf: "flex-end" }}
                  >
                    Create
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Product Section */}
          <Card
            variant="outlined"
            sx={{
              borderColor: "var(--outline-variant)",
              display: activeSection === "product" ? "block" : "none",
            }}
          >
            <CardContent>
              <Stack
                component="form"
                spacing={2.5}
                onSubmit={handleCreateProduct}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    Add Product
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--on-surface-variant)",
                      fontSize: "0.75rem",
                    }}
                  >
                    Create a new door product with pricing and delivery
                    configuration
                  </Typography>
                </Box>

                {/* Product Details Grid */}
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
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
                    size="small"
                    variant="outlined"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Product Name"
                    value={productName}
                    onChange={(event) => {
                      const value = event.target.value;
                      setProductName(value);
                      if (!productSlug) {
                        setProductSlug(toSlug(value));
                      }
                    }}
                    size="small"
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <ShoppingBagIcon sx={{ fontSize: "1.25rem" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Slug"
                    value={productSlug}
                    onChange={(event) =>
                      setProductSlug(toSlug(event.target.value))
                    }
                    size="small"
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon sx={{ fontSize: "1.25rem" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                {/* Pricing Grid */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                      mb: 1.5,
                    }}
                  >
                    Pricing
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                    }}
                  >
                    <TextField
                      label="Base Price"
                      type="number"
                      value={basePrice}
                      onChange={(event) => setBasePrice(event.target.value)}
                      size="small"
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoneyIcon sx={{ fontSize: "1.25rem" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      label="Price per cm (Height)"
                      type="number"
                      value={extraHeightPrice}
                      onChange={(event) =>
                        setExtraHeightPrice(event.target.value)
                      }
                      size="small"
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoneyIcon sx={{ fontSize: "1.25rem" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      label="Price per cm (Width)"
                      type="number"
                      value={extraWidthPrice}
                      onChange={(event) =>
                        setExtraWidthPrice(event.target.value)
                      }
                      size="small"
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <AttachMoneyIcon sx={{ fontSize: "1.25rem" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Dimensions Grid */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                      mb: 1.5,
                    }}
                  >
                    Default Dimensions
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                    }}
                  >
                    <TextField
                      label="Base Height (cm)"
                      type="number"
                      value={baseHeightCm}
                      onChange={(event) => setBaseHeightCm(event.target.value)}
                      size="small"
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <HeightIcon sx={{ fontSize: "1.25rem" }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      label="Base Width (cm)"
                      type="number"
                      value={baseWidthCm}
                      onChange={(event) => setBaseWidthCm(event.target.value)}
                      size="small"
                      variant="outlined"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <HeightIcon
                                sx={{ fontSize: "1.25rem", rotate: "90deg" }}
                              />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Description */}
                <TextField
                  label="Description"
                  value={productDescription}
                  onChange={(event) =>
                    setProductDescription(event.target.value)
                  }
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                  variant="outlined"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mt: 2 }}>
                          <DescriptionIcon sx={{ fontSize: "1.25rem" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* Images Section */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                      mb: 1.5,
                    }}
                  >
                    Product Images
                  </Typography>
                  <Stack spacing={1.5}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Select Images (Up to 12)
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
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--on-surface-variant)" }}
                    >
                      Images will be displayed as a carousel on the product
                      page.
                    </Typography>
                    {productImageFiles.length > 0 && (
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
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Box>

                {/* Delivery Tiers Section */}
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "0.75rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        Delivery Tiers
                      </Typography>
                    </Box>
                    <Button
                      type="button"
                      startIcon={<AddIcon />}
                      size="small"
                      variant="text"
                      onClick={() =>
                        setTiers((prev) => [
                          ...prev,
                          createTierDraft(prev[prev.length - 1].id + 1),
                        ])
                      }
                    >
                      Add Tier
                    </Button>
                  </Stack>

                  <Stack spacing={1.5}>
                    {tiers.map((tier) => (
                      <Box
                        key={tier.id}
                        sx={{
                          display: "grid",
                          gap: 1.5,
                          gridTemplateColumns: {
                            xs: "1fr 1fr",
                            md: "repeat(4, minmax(0, 1fr)) auto",
                          },
                          alignItems: "flex-end",
                          p: 2,
                          backgroundColor: "var(--surface-container-low)",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--outline-variant)",
                        }}
                      >
                        <TextField
                          label="Min Qty"
                          type="number"
                          value={tier.min_quantity}
                          onChange={(event) =>
                            updateTier(
                              tier.id,
                              "min_quantity",
                              parsePositiveIntegerFromInput(
                                event.target.value,
                                tier.min_quantity,
                              ),
                            )
                          }
                          size="small"
                          variant="outlined"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoneyIcon
                                    sx={{ fontSize: "1.25rem" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <TextField
                          label="Max Qty (leave blank for unlimited)"
                          type="number"
                          value={tier.max_quantity ?? ""}
                          onChange={(event) =>
                            updateTier(
                              tier.id,
                              "max_quantity",
                              event.target.value === ""
                                ? null
                                : parsePositiveIntegerFromInput(
                                    event.target.value,
                                    tier.max_quantity ?? tier.min_quantity,
                                  ),
                            )
                          }
                          size="small"
                          variant="outlined"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoneyIcon
                                    sx={{ fontSize: "1.25rem" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <TextField
                          label="Delivery Days"
                          type="number"
                          value={tier.delivery_days}
                          onChange={(event) =>
                            updateTier(
                              tier.id,
                              "delivery_days",
                              parsePositiveIntegerFromInput(
                                event.target.value,
                                tier.delivery_days,
                              ),
                            )
                          }
                          size="small"
                          variant="outlined"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocalShippingIcon
                                    sx={{ fontSize: "1.25rem" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <Button
                          type="button"
                          color="error"
                          onClick={() =>
                            setTiers((prev) =>
                              prev.length === 1
                                ? prev
                                : prev.filter((item) => item.id !== tier.id),
                            )
                          }
                          startIcon={<DeleteIcon />}
                          size="small"
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  sx={{ py: 1.5 }}
                >
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Existing Products Section */}
          <Card
            variant="outlined"
            sx={{
              borderColor: "divider",
              display: activeSection === "catalog" ? "block" : "none",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: (theme) => theme.typography.h6.fontFamily,
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Catalog ({products.length})
              </Typography>
              <Stack spacing={2}>
                {products.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No products created yet.
                  </Typography>
                ) : (
                  products.map((product) => (
                    <CatalogProductRow
                      key={product.id}
                      product={product}
                      onEdit={(p) => setEditProduct(p)}
                      onDelete={(p) => setDeleteTarget(p)}
                    />
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <EditProductDialog
        open={Boolean(editProduct)}
        product={editProduct}
        categories={categories}
        onClose={() => setEditProduct(null)}
        onSaved={() => {
          void loadData();
          setSuccessMessage("Product updated.");
        }}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (!deleteSubmitting ? setDeleteTarget(null) : undefined)}
        aria-labelledby="delete-product-title"
      >
        <DialogTitle id="delete-product-title">Delete product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `This removes "${deleteTarget.name}" and its images from storage. Orders that reference this product can block deletion in some environments; if that happens, disable the product instead.`
              : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleteSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteSubmitting}
            onClick={() => void confirmDeleteProduct()}
          >
            {deleteSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
