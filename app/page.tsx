"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FactoryIcon from "@mui/icons-material/Factory";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { useEffect, useState } from "react";
import CatalogProductCard from "@/components/shop/catalog-product-card";
import SupabaseConfigAlert from "@/components/supabase-config-alert";
import {
  fetchCatalogData,
  fetchCatalogHighlights,
} from "@/services/catalog/catalog.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { CatalogProduct } from "@/types/domain";

const VALUE_ITEMS = [
  {
    title: "Crafted In-House",
    description:
      "Every frame is engineered and assembled by our own production team.",
    icon: <FactoryIcon fontSize="small" />,
  },
  {
    title: "Precision First",
    description:
      "Dimension-by-dimension manufacturing with transparent lead-time tiers.",
    icon: <PrecisionManufacturingIcon fontSize="small" />,
  },
  {
    title: "Reliable Delivery",
    description:
      "End-to-end order tracking with clear status updates for every project.",
    icon: <VerifiedUserIcon fontSize="small" />,
  },
];

export default function HomePage() {
  const [highlights, setHighlights] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHighlights() {
      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const highlightResult = await fetchCatalogHighlights(4);

      if (!mounted) return;

      if (!highlightResult.error && highlightResult.data) {
        setHighlights(highlightResult.data);
        setIsLoading(false);
        return;
      }

      const catalogResult = await fetchCatalogData();
      if (!mounted) return;

      if (catalogResult.error) {
        setErrorMessage(catalogResult.error);
        setIsLoading(false);
        return;
      }

      if (!catalogResult.data) {
        setErrorMessage("Catalog response is empty.");
        setIsLoading(false);
        return;
      }

      setHighlights(catalogResult.data.products.slice(0, 4));
      setIsLoading(false);
    }

    void loadHighlights();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 420, md: 560 },
          display: "flex",
          alignItems: "center",
          backgroundImage:
            'url("https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1800&h=1000&fit=crop")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(100deg, rgba(5,10,19,0.83) 0%, rgba(5,10,19,0.46) 55%, rgba(5,10,19,0.2) 100%)",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Stack spacing={2.2} sx={{ maxWidth: 720 }}>
            <Typography
              variant="overline"
              sx={{
                color: alpha("#ffffff", 0.9),
                letterSpacing: "0.2em",
                fontWeight: 700,
              }}
            >
              BOUDOKHANE DOORS
            </Typography>
            <Typography
              variant="h1"
              sx={{
                color: "common.white",
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3.25rem" },
                lineHeight: 1.08,
              }}
            >
              Architectural entry systems built for modern spaces.
            </Typography>
            <Typography
              sx={{
                color: alpha("#ffffff", 0.86),
                fontSize: { xs: "1rem", md: "1.1rem" },
                maxWidth: 560,
              }}
            >
              Premium doors, tailored dimensions, and professional delivery
              workflow from first selection to final installation.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              pt={0.5}
            >
              <Button
                component={Link}
                href="/collections"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 700 }}
              >
                Explore Collections
              </Button>
              <Button
                component={Link}
                href="/track"
                variant="outlined"
                size="large"
                sx={{
                  fontWeight: 700,
                  color: "common.white",
                  borderColor: alpha("#ffffff", 0.5),
                  "&:hover": {
                    borderColor: "common.white",
                    backgroundColor: alpha("#ffffff", 0.08),
                  },
                }}
              >
                Track Existing Order
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
        {!isSupabaseConfigured() ? <SupabaseConfigAlert /> : null}

        <Stack spacing={5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.2 }}>
              Why Teams Choose Boudokhane
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 820 }}>
              We combine manufacturing discipline with a practical ordering
              system so architects, contractors, and homeowners can move from
              concept to delivery without friction.
            </Typography>
          </Box>

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
            {VALUE_ITEMS.map((item) => (
              <Card
                key={item.title}
                variant="outlined"
                sx={{ borderColor: "divider" }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Stack spacing={1.3}>
                    <Box sx={{ color: "primary.main", lineHeight: 1 }}>
                      {item.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontSize: "1.05rem" }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: "0.92rem" }}
                    >
                      {item.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={1}
              sx={{ mb: 2.2 }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.6 }}>
                  Most Ordered Highlights
                </Typography>
                <Typography color="text.secondary">
                  A quick look at the products customers currently choose most.
                </Typography>
              </Box>
              <Button component={Link} href="/collections" variant="text">
                View full catalog
              </Button>
            </Stack>

            {isLoading ? (
              <Box
                sx={{ minHeight: 260, display: "grid", placeItems: "center" }}
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
                {highlights.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </Box>
            ) : null}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
