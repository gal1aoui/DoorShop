"use client";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import CatalogProductCard from "@/components/shop/catalog-product-card";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import { fetchCatalogData } from "@/services/catalog/catalog.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { CatalogProduct, DoorCategory } from "@/types/domain";

function parsePriceFilter(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function CollectionsPage() {
  const [categories, setCategories] = useState<DoorCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");

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

      setCategories(result.data.categories);
      setProducts(result.data.products);
      setIsLoading(false);
    }

    void loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const rawMinPrice = parsePriceFilter(
      minPriceFilter,
      Number.NEGATIVE_INFINITY,
    );
    const rawMaxPrice = parsePriceFilter(
      maxPriceFilter,
      Number.POSITIVE_INFINITY,
    );
    const minPrice = Math.min(rawMinPrice, rawMaxPrice);
    const maxPrice = Math.max(rawMinPrice, rawMaxPrice);

    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === "all" || product.category_id === categoryFilter;
      const matchesPrice =
        product.base_price >= minPrice && product.base_price <= maxPrice;

      return matchesCategory && matchesPrice;
    });
  }, [categoryFilter, maxPriceFilter, minPriceFilter, products]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Collections
          </Typography>
          <Typography color="text.secondary">
            Explore our complete catalog with precision filters for style and
            pricing.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "280px minmax(0, 1fr)",
            },
            alignItems: "start",
          }}
        >
          <Card
            variant="outlined"
            sx={{
              borderColor: "divider",
              position: { lg: "sticky" },
              top: { lg: 88 },
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "text.secondary",
                  }}
                >
                  Filter
                </Typography>

                <TextField
                  select
                  label="Category"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterListIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
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
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Max price"
                  type="number"
                  value={maxPriceFilter}
                  onChange={(event) => setMaxPriceFilter(event.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Box>
            <Typography sx={{ mb: 2, color: "text.secondary" }}>
              Showing {filteredProducts.length} products
            </Typography>

            {isLoading ? (
              <Box
                sx={{ minHeight: 320, display: "grid", placeItems: "center" }}
              >
                <CircularProgress />
              </Box>
            ) : null}

            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}

            {!isLoading && !errorMessage ? (
              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 2.5, md: 3.25 },
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                {filteredProducts.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
