"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import ProductImageCarousel from "@/components/shop/product-image-carousel";
import type { CatalogProduct, DoorDeliveryTier } from "@/types/domain";
import { formatMoney } from "@/utils/formatters";

type CatalogProductRowProps = {
  product: CatalogProduct;
  onEdit: (product: CatalogProduct) => void;
  onDelete: (product: CatalogProduct) => void;
};

export default function CatalogProductRow({
  product,
  onEdit,
  onDelete,
}: CatalogProductRowProps) {
  const tierCount =
    (product.door_delivery_tiers as DoorDeliveryTier[] | undefined)?.length ??
    0;
  const imageCount = product.door_product_images?.length ?? 0;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "divider",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          borderColor: "divider",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 24px rgba(0,0,0,0.35)"
              : "0 8px 24px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { sm: "stretch" } }}
      >
        <Box
          sx={{
            width: { xs: "100%", sm: 200, md: 240 },
            flexShrink: 0,
            alignSelf: { xs: "stretch", sm: "auto" },
          }}
        >
          <ProductImageCarousel
            images={product.door_product_images ?? []}
            aspectRatio="4 / 3"
            minHeight={160}
          />
        </Box>
        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            py: 2.5,
            "&:last-child": { pb: 2.5 },
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: (theme) => theme.typography.h6.fontFamily,
                fontWeight: 700,
                mb: 0.25,
              }}
            >
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
              {product.slug}
            </Typography>
          </Box>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Category: {product.door_categories?.name ?? "Unknown"}
            </Typography>
            <Typography variant="body2">
              Base: {formatMoney(product.base_price)} - {product.base_height_cm}
              cm x {product.base_width_cm}cm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Extra: {formatMoney(product.price_per_extra_cm_height)}/cm (H),{" "}
              {formatMoney(product.price_per_extra_cm_width)}/cm (W)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Images: {imageCount} - Delivery tiers: {tierCount}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: "auto", pt: 1 }}
            flexWrap="wrap"
            useFlexGap
          >
            <Button
              component={Link}
              href={`/products/${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              sx={{ textTransform: "none" }}
            >
              Preview
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<EditOutlinedIcon />}
              onClick={() => onEdit(product)}
              sx={{ textTransform: "none" }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => onDelete(product)}
              sx={{ textTransform: "none" }}
            >
              Delete
            </Button>
          </Stack>
        </CardContent>
      </Stack>
    </Card>
  );
}
