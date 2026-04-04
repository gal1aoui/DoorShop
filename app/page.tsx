"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductImageCarousel from "@/components/shop/product-image-carousel";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import { fetchCatalogData } from "@/services/catalog/catalog.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { CatalogProduct, DoorCategory } from "@/types/domain";
import { formatMoney } from "@/utils/formatters";

function minDeliveryLabel(product: CatalogProduct): string {
  if (!product.door_delivery_tiers.length) {
    return "Delivery tier not set";
  }

  const minDays = Math.min(
    ...product.door_delivery_tiers.map((tier) => tier.delivery_days),
  );
  return `From ${minDays} day(s)`;
}

export default function HomePage() {
  const [categories, setCategories] = useState<DoorCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minPriceFilter, setMinPriceFilter] = useState<string>("");
  const [maxPriceFilter, setMaxPriceFilter] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      const result = await fetchCatalogData();

      if (!mounted) return;

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

      setCategories(result.data.categories as DoorCategory[]);
      setProducts(result.data.products as CatalogProduct[]);
      setIsLoading(false);
    }

    void loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const minPrice =
      minPriceFilter.trim() === ""
        ? Number.NEGATIVE_INFINITY
        : Number(minPriceFilter);
    const maxPrice =
      maxPriceFilter.trim() === ""
        ? Number.POSITIVE_INFINITY
        : Number(maxPriceFilter);

    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === "all" || product.category_id === categoryFilter;
      const matchesPrice =
        product.base_price >= minPrice && product.base_price <= maxPrice;

      return matchesCategory && matchesPrice;
    });
  }, [categoryFilter, minPriceFilter, maxPriceFilter, products]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Custom Door Catalog
          </Typography>
          <Typography color="text.secondary">
            Filter by category and budget, then place your order with custom
            dimensions.
          </Typography>
        </Box>

        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "2fr 1fr 1fr",
                },
              }}
            >
              <TextField
                select
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <MenuItem value="all">All categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Min price"
                type="number"
                value={minPriceFilter}
                onChange={(event) => setMinPriceFilter(event.target.value)}
              />
              <TextField
                label="Max price"
                type="number"
                value={maxPriceFilter}
                onChange={(event) => setMaxPriceFilter(event.target.value)}
              />
            </Box>
          </CardContent>
        </Card>

        {isLoading ? (
          <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoading && !errorMessage ? (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {filteredProducts.map((product) => (
              <Card key={product.id} variant="outlined">
                <ProductImageCarousel
                  images={product.door_product_images ?? []}
                  height={190}
                />
                <CardContent>
                  <Stack spacing={1.2}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {product.name}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={product.door_categories?.name ?? "Uncategorized"}
                        size="small"
                      />
                      <Chip label={minDeliveryLabel(product)} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {product.description || "No description yet."}
                    </Typography>
                    <Typography variant="body2">
                      Base dimensions: {product.base_height_cm}cm x{" "}
                      {product.base_width_cm}cm
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {formatMoney(product.base_price)}
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    component={Link}
                    href={`/products/${product.id}`}
                    variant="contained"
                    fullWidth
                  >
                    View and Order
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : null}

        {!isLoading && filteredProducts.length === 0 ? (
          <Alert severity="info">
            No doors match your current filters. Try widening your price range
            or selecting another category.
          </Alert>
        ) : null}
      </Stack>
    </Container>
  );
}
