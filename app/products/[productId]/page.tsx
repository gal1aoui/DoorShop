"use client";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrderForm from "@/components/shop/order-form";
import ProductImageCarousel from "@/components/shop/product-image-carousel";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import { fetchCatalogProductById } from "@/services/catalog/catalog.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { CatalogProduct } from "@/types/domain";
import { formatMoney } from "@/utils/formatters";

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      const result = await fetchCatalogProductById(productId);

      if (!mounted) return;

      if (result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      if (!result.data) {
        setErrorMessage("Product response is empty.");
        setIsLoading(false);
        return;
      }

      setProduct(result.data as CatalogProduct);
      setIsLoading(false);
    }

    void loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2.5}>
        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

        {isLoading ? (
          <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoading && product ? (
          <>
            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
              >
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {product.name}
                </Typography>
                <Chip
                  label={product.door_categories?.name ?? "Uncategorized"}
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {product.description ??
                  "No description available for this model."}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Base price: {formatMoney(product.base_price)}
              </Typography>
              <Typography variant="body2">
                Base size: {product.base_height_cm}cm x {product.base_width_cm}
                cm
              </Typography>
              <Typography variant="body2">
                +Height: {formatMoney(product.price_per_extra_cm_height)} / cm
              </Typography>
              <Typography variant="body2">
                +Width: {formatMoney(product.price_per_extra_cm_width)} / cm
              </Typography>
            </Box>

            <ProductImageCarousel
              images={product.door_product_images ?? []}
              height={320}
            />

            <OrderForm product={product} />
          </>
        ) : null}
      </Stack>
    </Container>
  );
}
