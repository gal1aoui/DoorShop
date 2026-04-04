"use client";

import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
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
  return `${minDays} day(s)`;
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
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 400, md: 600 },
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          backgroundImage:
            'url("https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=800&fit=crop")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)",
            zIndex: 1,
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#fac097",
              fontWeight: 700,
              mb: 2,
            }}
          >
            The Art of Entry
          </Typography>
          <Typography
            variant="h2"
            sx={{
              color: "#f7f7fa",
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2.5rem", md: "4rem" },
              mb: 3,
              maxWidth: "800px",
            }}
          >
            Structural Integrity.
          </Typography>
          <Typography
            sx={{
              color: "rgba(247, 247, 250, 0.8)",
              fontSize: { xs: "1rem", md: "1.125rem" },
              maxWidth: "600px",
              mb: 4,
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            Bespoke architectural solutions that redefine the transition between
            spaces. Precision engineered in our atelier.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              component="a"
              href="#catalog"
              variant="contained"
              sx={{
                backgroundColor: "#815534",
                color: "#fff7f4",
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: "0.875rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                "&:hover": {
                  backgroundColor: "#6c4324",
                },
              }}
            >
              Explore Collections
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 2,
            mb: 12,
          }}
        >
          {/* Filter Card */}
          <Card
            variant="outlined"
            sx={{
              gridColumn: { xs: "1 / -1", md: "1 / 2" },
              borderColor: "var(--outline-variant)",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  mb: 3,
                  fontSize: "0.875rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--on-surface-variant)",
                }}
              >
                Filter by Category
              </Typography>
              <TextField
                select
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  select: {
                    MenuProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          fontFamily: '"Inter", sans-serif',
                        },
                      },
                    },
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterListIcon sx={{ fontSize: "1.25rem" }} />
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

              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 700,
                  mt: 4,
                  mb: 2,
                  fontSize: "0.875rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--on-surface-variant)",
                }}
              >
                Price Range
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Min price"
                  type="number"
                  value={minPriceFilter}
                  onChange={(event) => setMinPriceFilter(event.target.value)}
                  size="small"
                  fullWidth
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
                  label="Max price"
                  type="number"
                  value={maxPriceFilter}
                  onChange={(event) => setMaxPriceFilter(event.target.value)}
                  size="small"
                  fullWidth
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
              </Stack>
            </CardContent>
          </Card>

          {/* Main Catalog Area */}
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "2 / -1" } }} id="catalog">
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Manrope", sans-serif',
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  mb: 1,
                }}
              >
                Current Selection
              </Typography>
              <Typography color="textSecondary" sx={{ fontSize: "0.875rem" }}>
                Showing {filteredProducts.length} precision-crafted entries
              </Typography>
            </Box>

            {isLoading ? (
              <Box
                sx={{
                  minHeight: 400,
                  display: "grid",
                  placeItems: "center",
                }}
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
                  gap: 4,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    variant="outlined"
                    component={Link}
                    href={`/products/${product.id}`}
                    sx={{
                      textDecoration: "none",
                      color: "inherit",
                      borderColor: "var(--outline-variant)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 2,
                        borderColor: "var(--primary)",
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <ProductImageCarousel
                      images={product.door_product_images ?? []}
                      height={250}
                    />
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: '"Manrope", sans-serif',
                            fontWeight: 700,
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={
                              product.door_categories?.name ?? "Uncategorized"
                            }
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`${minDeliveryLabel(product)} lead time`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                        <Box
                          sx={{
                            pt: 2,
                            borderTop: "1px solid",
                            borderColor: "var(--outline-variant)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: '"Manrope", sans-serif',
                              fontWeight: 700,
                              fontSize: "1rem",
                            }}
                          >
                            From {formatMoney(product.base_price)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "var(--tertiary-dim)",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            {minDeliveryLabel(product)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
