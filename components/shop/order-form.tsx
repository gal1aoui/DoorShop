"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createPublicOrder } from "@/services/orders/public-orders.service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import type { CatalogProduct } from "@/types/domain";
import {
  calculateUnitPriceForDimensions,
  getDeliveryDaysForQuantity,
} from "@/utils/catalog";
import { formatMoney } from "@/utils/formatters";

interface OrderLineDraft {
  id: number;
  quantity: number;
  height_cm: number;
  width_cm: number;
}

function initialWantedDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export default function OrderForm({ product }: { product: CatalogProduct }) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [wantedDate, setWantedDate] = useState(initialWantedDate());
  const [lines, setLines] = useState<OrderLineDraft[]>([
    {
      id: 1,
      quantity: 1,
      height_cm: product.base_height_cm,
      width_cm: product.base_width_cm,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const totalAmount = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const unit = calculateUnitPriceForDimensions(
          product,
          line.height_cm,
          line.width_cm,
        );
        return sum + unit * line.quantity;
      }, 0),
    [lines, product],
  );

  const maxDeliveryDays = useMemo(() => {
    return lines.reduce((max, line) => {
      const days = getDeliveryDaysForQuantity(
        product.door_delivery_tiers,
        line.quantity,
      );
      if (days === null) return max;
      return Math.max(max, days);
    }, 0);
  }, [lines, product.door_delivery_tiers]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        quantity: 1,
        height_cm: product.base_height_cm,
        width_cm: product.base_width_cm,
      },
    ]);
  }

  function updateLine(
    id: number,
    key: keyof Omit<OrderLineDraft, "id">,
    value: number,
  ) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [key]: value } : line)),
    );
  }

  function removeLine(id: number) {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setTrackingToken(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        "Supabase keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim() || !deliveryLocation.trim()) {
      setErrorMessage("Please fill all required customer fields.");
      return;
    }

    if (
      lines.some(
        (line) =>
          line.quantity <= 0 || line.height_cm <= 0 || line.width_cm <= 0,
      )
    ) {
      setErrorMessage("All quantities and dimensions must be positive.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPublicOrder({
      fullName,
      phoneNumber,
      deliveryLocation,
      customerNote: customerNote || null,
      wantedDate,
      items: lines.map((line) => ({
        product_id: product.id,
        quantity: line.quantity,
        height_cm: line.height_cm,
        width_cm: line.width_cm,
      })),
    });

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    if (!result.data) {
      setErrorMessage("Order response is empty.");
      return;
    }

    setTrackingToken(result.data.trackingToken);
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Place an Order
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No account is required. Add your info and customized dimensions.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            <TextField
              label="Full name"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <TextField
              label="Phone number"
              required
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
            <TextField
              label="Delivery location"
              required
              value={deliveryLocation}
              onChange={(event) => setDeliveryLocation(event.target.value)}
            />
            <TextField
              label="Wanted date"
              type="date"
              required
              value={wantedDate}
              onChange={(event) => setWantedDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Description / notes"
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              multiline
              minRows={2}
              sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
            />
          </Box>

          <Divider />

          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Dimension lines
              </Typography>
              <Button onClick={addLine} startIcon={<AddIcon />} size="small">
                Add another size
              </Button>
            </Stack>

            {lines.map((line) => {
              const unitPrice = calculateUnitPriceForDimensions(
                product,
                line.height_cm,
                line.width_cm,
              );
              const subtotal = unitPrice * line.quantity;
              const deliveryDays = getDeliveryDaysForQuantity(
                product.door_delivery_tiers,
                line.quantity,
              );

              return (
                <Box
                  key={line.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: {
                        xs: "1fr 1fr",
                        md: "repeat(4, minmax(0, 1fr)) auto",
                      },
                    }}
                  >
                    <TextField
                      label="Qty"
                      type="number"
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(
                          line.id,
                          "quantity",
                          Math.max(1, Number(event.target.value)),
                        )
                      }
                      slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <TextField
                      label="Height (cm)"
                      type="number"
                      value={line.height_cm}
                      onChange={(event) =>
                        updateLine(
                          line.id,
                          "height_cm",
                          Math.max(1, Number(event.target.value)),
                        )
                      }
                      slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <TextField
                      label="Width (cm)"
                      type="number"
                      value={line.width_cm}
                      onChange={(event) =>
                        updateLine(
                          line.id,
                          "width_cm",
                          Math.max(1, Number(event.target.value)),
                        )
                      }
                      slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <Box
                      sx={{
                        alignSelf: "center",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                      }}
                    >
                      <Typography variant="body2">
                        Unit: {formatMoney(unitPrice)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Subtotal: {formatMoney(subtotal)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {deliveryDays
                          ? `${deliveryDays} day(s) estimated`
                          : "No tier defined"}
                      </Typography>
                    </Box>
                    <IconButton
                      aria-label="remove line"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Order total: {formatMoney(totalAmount)}
            </Typography>
            {maxDeliveryDays > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Longest estimated lead time based on selected quantities:{" "}
                {maxDeliveryDays} day(s)
              </Typography>
            ) : null}
          </Box>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {trackingToken ? (
            <Alert severity="success">
              Order submitted. Track it here:{" "}
              <Link href={`/track/${trackingToken}`}>
                /track/{trackingToken}
              </Link>
            </Alert>
          ) : null}

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit order"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
