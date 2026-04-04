"use client";

import {
  Alert,
  Box,
  Breadcrumbs,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
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
    <Box sx={{ pt: 4, pb: 8 }}>
      <Container maxWidth="lg">
        {/* Breadcrumb */}
        {product && (
          <Breadcrumbs
            sx={{
              mb: 4,
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <Link href="/" style={{ color: "inherit" }}>
              Home
            </Link>
            <Link href="/" style={{ color: "inherit" }}>
              Collections
            </Link>
            <Typography sx={{ color: "text.primary" }}>
              {product.name}
            </Typography>
          </Breadcrumbs>
        )}

        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

        {isLoading ? (
          <Box sx={{ minHeight: 500, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!isLoading && product ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: { xs: 3, lg: 6 },
              alignItems: "start",
            }}
          >
            {/* Left Column: Images */}
            <Box>
              <Box
                sx={{
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  mb: 3,
                  backgroundColor: "var(--surface-container-low)",
                }}
              >
                <ProductImageCarousel
                  images={product.door_product_images ?? []}
                  height={500}
                />
              </Box>

              {/* Thumbnails */}
              {(product.door_product_images?.length || 0) > 0 && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 2,
                  }}
                >
                  {product.door_product_images?.slice(0, 4).map((image) => (
                    <Box
                      key={image.id}
                      sx={{
                        aspectRatio: "1",
                        borderRadius: "0.5rem",
                        overflow: "hidden",
                        backgroundColor: "var(--surface-container-low)",
                        border: "2px solid var(--outline-variant)",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "var(--primary)",
                        },
                      }}
                    >
                      <Image
                        src={image.public_url}
                        alt={image.alt_text || "Product image"}
                        width={200}
                        height={200}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Description Card */}
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  backgroundColor: "var(--surface-container-low)",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Manrope", sans-serif',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  The Monolith Construction
                </Typography>
                <Typography
                  sx={{
                    color: "var(--on-surface-variant)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  {product.description ||
                    "Engineered for excellence and permanence. Each door features a robust construction with premium materials and precision engineering for superior performance."}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    pt: 2,
                    borderTop: "1px solid var(--outline-variant)",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        color: "var(--on-surface-variant)",
                        mb: 0.5,
                      }}
                    >
                      Base Dimensions
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Manrope", sans-serif',
                        fontWeight: 700,
                      }}
                    >
                      {product.base_height_cm}cm × {product.base_width_cm}cm
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        color: "var(--on-surface-variant)",
                        mb: 0.5,
                      }}
                    >
                      Category
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Manrope", sans-serif',
                        fontWeight: 700,
                      }}
                    >
                      {product.door_categories?.name || "General"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Right Column: Order Form (Sticky) */}
            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  position: { xs: "relative", lg: "sticky" },
                  top: { lg: "80px" },
                }}
              >
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"Manrope", sans-serif',
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      mb: 1,
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: "var(--tertiary)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      mb: 2,
                    }}
                  >
                    Premium Collection — Item #{product.slug.toUpperCase()}
                  </Typography>

                  {/* Pricing */}
                  <Box
                    sx={{
                      backgroundColor: "var(--surface-container-high)",
                      p: 3,
                      borderRadius: "0.5rem",
                      border: "1px solid var(--outline-variant)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          color: "var(--on-surface-variant)",
                          mb: 0.5,
                        }}
                      >
                        Starting From
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "1.75rem",
                          fontFamily: '"Manrope", sans-serif',
                          fontWeight: 800,
                        }}
                      >
                        {formatMoney(product.base_price)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          color: "var(--on-surface-variant)",
                          mb: 0.5,
                        }}
                      >
                        Estimated Delivery
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Manrope", sans-serif',
                          fontWeight: 700,
                        }}
                      >
                        4-6 Weeks
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Order Form */}
                <OrderForm product={product} />
              </Box>
            </Box>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
