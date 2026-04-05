"use client";

import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import HeightIcon from "@mui/icons-material/Height";
import LinkIcon from "@mui/icons-material/Link";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SaveIcon from "@mui/icons-material/Save";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { updateDoorProductWithTiers } from "@/services/admin/products.service";
import type { TierDraft } from "@/types/admin";
import type { CatalogProduct, DoorCategory } from "@/types/domain";
import { formatMoney, toSlug } from "@/utils/formatters";

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

type EditProductDialogProps = {
  open: boolean;
  product: CatalogProduct | null;
  categories: DoorCategory[];
  onClose: () => void;
  onSaved: () => void;
};

export default function EditProductDialog({
  open,
  product,
  categories,
  onClose,
  onSaved,
}: EditProductDialogProps) {
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("0");
  const [baseHeightCm, setBaseHeightCm] = useState("180");
  const [baseWidthCm, setBaseWidthCm] = useState("100");
  const [extraHeightPrice, setExtraHeightPrice] = useState("0");
  const [extraWidthPrice, setExtraWidthPrice] = useState("0");
  const [tiers, setTiers] = useState<TierDraft[]>([createTierDraft(1)]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFromProduct = useCallback((p: CatalogProduct | null) => {
    if (!p) {
      return;
    }
    setCategoryId(p.category_id);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description ?? "");
    setBasePrice(String(p.base_price));
    setBaseHeightCm(String(p.base_height_cm));
    setBaseWidthCm(String(p.base_width_cm));
    setExtraHeightPrice(String(p.price_per_extra_cm_height));
    setExtraWidthPrice(String(p.price_per_extra_cm_width));
    setSlugTouched(true);
    const rawTiers = p.door_delivery_tiers ?? [];
    if (rawTiers.length === 0) {
      setTiers([createTierDraft(1)]);
      return;
    }
    setTiers(
      rawTiers.map((tier, index) => ({
        id: index + 1,
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        delivery_days: tier.delivery_days,
      })),
    );
  }, []);

  useEffect(() => {
    if (open && product) {
      resetFromProduct(product);
      setError(null);
    }
  }, [open, product, resetFromProduct]);

  function updateTier(
    id: number,
    key: keyof Omit<TierDraft, "id">,
    value: number | null,
  ) {
    setTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, [key]: value } : tier)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!product) return;

    setError(null);

    const trimmedName = name.trim();
    const normalizedSlug = toSlug(slug || name);
    if (!categoryId.trim()) {
      setError("ERR_PRODUCT_CATEGORY_REQUIRED: Category is required.");
      return;
    }
    if (!trimmedName) {
      setError("ERR_PRODUCT_NAME_REQUIRED: Product name is required.");
      return;
    }
    if (!normalizedSlug) {
      setError("ERR_PRODUCT_SLUG_REQUIRED: Product slug is required.");
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
      setError(
        "ERR_PRODUCT_NUMERIC_FIELDS_INVALID: Check pricing and dimensions.",
      );
      return;
    }

    setSubmitting(true);

    const result = await updateDoorProductWithTiers({
      id: product.id,
      category_id: categoryId,
      name: trimmedName,
      slug: normalizedSlug,
      description: description.trim() || null,
      base_price: parsedBasePrice,
      base_height_cm: parsedBaseHeight,
      base_width_cm: parsedBaseWidth,
      price_per_extra_cm_height: parsedExtraHeight,
      price_per_extra_cm_width: parsedExtraWidth,
      delivery_tiers: tiers.map((tier) => ({
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        delivery_days: tier.delivery_days,
      })),
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="edit-product-title"
    >
      <DialogTitle id="edit-product-title">
        Edit product
        {product ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {product.name} - list {formatMoney(product.base_price)} base
          </Typography>
        ) : null}
      </DialogTitle>
      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <DialogContent dividers sx={{ pt: 2 }}>
          {error ? (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          ) : null}

          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              }}
            >
              <TextField
                select
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Product name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slugTouched) {
                    setSlug(toSlug(v));
                  }
                }}
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
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(toSlug(e.target.value));
                }}
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

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ alignSelf: "flex-start", mt: 2 }}
                    >
                      <DescriptionIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Typography variant="overline" color="text.secondary">
              Pricing
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              }}
            >
              <TextField
                label="Base price"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
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
                label="Price per cm (height)"
                type="number"
                value={extraHeightPrice}
                onChange={(e) => setExtraHeightPrice(e.target.value)}
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
                label="Price per cm (width)"
                type="number"
                value={extraWidthPrice}
                onChange={(e) => setExtraWidthPrice(e.target.value)}
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

            <Typography variant="overline" color="text.secondary">
              Default dimensions (cm)
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              }}
            >
              <TextField
                label="Base height"
                type="number"
                value={baseHeightCm}
                onChange={(e) => setBaseHeightCm(e.target.value)}
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
                label="Base width"
                type="number"
                value={baseWidthCm}
                onChange={(e) => setBaseWidthCm(e.target.value)}
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

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="overline" color="text.secondary">
                Delivery tiers
              </Typography>
              <Button
                type="button"
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setTiers((prev) => {
                    const nextId = prev.length
                      ? prev[prev.length - 1].id + 1
                      : 1;
                    return [...prev, createTierDraft(nextId)];
                  })
                }
              >
                Add tier
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
                      sm: "repeat(4, minmax(0, 1fr)) auto",
                    },
                    alignItems: "flex-end",
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <TextField
                    label="Min qty"
                    type="number"
                    value={tier.min_quantity}
                    onChange={(e) =>
                      updateTier(
                        tier.id,
                        "min_quantity",
                        parsePositiveIntegerFromInput(
                          e.target.value,
                          tier.min_quantity,
                        ),
                      )
                    }
                    size="small"
                  />
                  <TextField
                    label="Max qty"
                    type="number"
                    value={tier.max_quantity ?? ""}
                    onChange={(e) =>
                      updateTier(
                        tier.id,
                        "max_quantity",
                        e.target.value === ""
                          ? null
                          : parsePositiveIntegerFromInput(
                              e.target.value,
                              tier.max_quantity ?? tier.min_quantity,
                            ),
                      )
                    }
                    size="small"
                    helperText="Blank = unlimited"
                  />
                  <TextField
                    label="Delivery days"
                    type="number"
                    value={tier.delivery_days}
                    onChange={(e) =>
                      updateTier(
                        tier.id,
                        "delivery_days",
                        parsePositiveIntegerFromInput(
                          e.target.value,
                          tier.delivery_days,
                        ),
                      )
                    }
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalShippingIcon sx={{ fontSize: "1.25rem" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    type="button"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() =>
                      setTiers((prev) =>
                        prev.length === 1
                          ? prev
                          : prev.filter((t) => t.id !== tier.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !product}
            startIcon={<SaveIcon />}
          >
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
