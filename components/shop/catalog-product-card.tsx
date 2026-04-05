"use client";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { CatalogProduct } from "@/types/domain";
import { formatMoney } from "@/utils/formatters";

function minDeliveryLabel(product: CatalogProduct): string {
  if (!product.door_delivery_tiers.length) {
    return "Delivery tier pending";
  }

  const minDays = Math.min(
    ...product.door_delivery_tiers.map((tier) => tier.delivery_days),
  );
  return `${minDays}-${Math.max(minDays + 2, minDays)} days delivery`;
}

function pickPrimaryImageUrl(product: CatalogProduct): string | null {
  const firstImage = [...(product.door_product_images ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order,
  )[0];
  return firstImage?.public_url ?? product.thumbnail_url ?? null;
}

type CatalogProductCardProps = {
  product: CatalogProduct;
};

export default function CatalogProductCard({
  product,
}: CatalogProductCardProps) {
  const primaryImageUrl = pickPrimaryImageUrl(product);

  return (
    <Card
      component={Link}
      href={`/products/${product.id}`}
      variant="outlined"
      sx={{
        textDecoration: "none",
        color: "inherit",
        borderColor: "divider",
        borderRadius: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 10px 24px rgba(0,0,0,0.42)"
              : "0 10px 24px rgba(15, 23, 42, 0.1)",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          aspectRatio: "3 / 4",
          backgroundColor: "action.hover",
          borderBottom: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {primaryImageUrl ? (
          <Box
            component="img"
            src={primaryImageUrl}
            alt={product.name}
            loading="lazy"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}
      </Box>

      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Stack spacing={1.1}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.05rem",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {product.door_categories?.name ?? "Custom collection"} - Bespoke
            finishes
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "space-between",
              alignItems: "baseline",
              pt: 1.1,
              borderTop: "1px solid",
              borderColor: "divider",
              flexWrap: "wrap",
              rowGap: 0.8,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
              From {formatMoney(product.base_price)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              {minDeliveryLabel(product)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
