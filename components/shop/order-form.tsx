"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import HeightIcon from "@mui/icons-material/Height";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NoteIcon from "@mui/icons-material/Note";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
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

function parsePositiveNumberFromInput(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
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
        "ERR_SUPABASE_CONFIG_MISSING: Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim() || !deliveryLocation.trim()) {
      setErrorMessage(
        "ERR_ORDER_CUSTOMER_REQUIRED: Provide customer name, phone, and delivery location.",
      );
      return;
    }

    const wantedDateValue = wantedDate.trim();
    const parsedWantedDate = new Date(`${wantedDateValue}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(parsedWantedDate.getTime())) {
      setErrorMessage(
        "ERR_ORDER_WANTED_DATE_INVALID: Wanted date must be a valid date.",
      );
      return;
    }

    if (parsedWantedDate < today) {
      setErrorMessage(
        "ERR_ORDER_WANTED_DATE_PAST: Wanted date must be today or later.",
      );
      return;
    }

    if (!lines.length) {
      setErrorMessage(
        "ERR_ORDER_ITEMS_REQUIRED: Add at least one item line before submitting.",
      );
      return;
    }

    if (
      lines.some(
        (line) =>
          !Number.isFinite(line.quantity) ||
          !Number.isFinite(line.height_cm) ||
          !Number.isFinite(line.width_cm) ||
          line.quantity <= 0 ||
          line.height_cm <= 0 ||
          line.width_cm <= 0,
      )
    ) {
      setErrorMessage(
        "ERR_ORDER_ITEMS_INVALID: All quantities and dimensions must be positive.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await createPublicOrder({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      deliveryLocation: deliveryLocation.trim(),
      customerNote: customerNote.trim() || null,
      wantedDate: wantedDateValue,
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
      setErrorMessage(
        "ERR_ORDER_RESPONSE_EMPTY: Order was created but response is empty.",
      );
      return;
    }

    setTrackingToken(result.data.trackingToken);
  }

  return (
    <Card
      variant="outlined"
      component="form"
      onSubmit={handleSubmit}
      sx={{
        borderColor: "var(--outline-variant)",
        backgroundColor: "var(--surface-container-lowest)",
      }}
    >
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Section 1: Customer Details */}
        <Box>
          <Typography
            sx={{
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--on-surface-variant)",
              mb: 2,
            }}
          >
            Step 1: Your Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              size="small"
              variant="outlined"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Phone Number"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              size="small"
              variant="outlined"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Delivery Location"
              value={deliveryLocation}
              onChange={(event) => setDeliveryLocation(event.target.value)}
              size="small"
              variant="outlined"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Wanted Date"
              type="date"
              value={wantedDate}
              onChange={(event) => setWantedDate(event.target.value)}
              size="small"
              variant="outlined"
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Special Instructions"
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              multiline
              minRows={2}
              size="small"
              variant="outlined"
              placeholder="E.g. Custom handles, grain direction..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <NoteIcon sx={{ fontSize: "1.25rem" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </Box>

        <Divider />

        {/* Section 2: Dimension Lines */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
              }}
            >
              Step 2: Customize Dimensions
            </Typography>
            <Button
              onClick={addLine}
              startIcon={<AddIcon />}
              size="small"
              variant="text"
            >
              Add Size
            </Button>
          </Stack>

          <Stack spacing={2}>
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
                    borderColor: "var(--outline-variant)",
                    borderRadius: "0.5rem",
                    p: 2,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr auto",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Height (cm)
                        </Typography>
                        <TextField
                          type="number"
                          value={line.height_cm}
                          onChange={(event) =>
                            updateLine(
                              line.id,
                              "height_cm",
                              parsePositiveNumberFromInput(
                                event.target.value,
                                line.height_cm,
                              ),
                            )
                          }
                          size="small"
                          variant="outlined"
                          slotProps={{
                            htmlInput: { min: 1 },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <HeightIcon sx={{ fontSize: "1.25rem" }} />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Width (cm)
                        </Typography>
                        <TextField
                          type="number"
                          value={line.width_cm}
                          onChange={(event) =>
                            updateLine(
                              line.id,
                              "width_cm",
                              parsePositiveNumberFromInput(
                                event.target.value,
                                line.width_cm,
                              ),
                            )
                          }
                          size="small"
                          variant="outlined"
                          slotProps={{
                            htmlInput: { min: 1 },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <HeightIcon
                                    sx={{
                                      fontSize: "1.25rem",
                                      rotate: "90deg",
                                    }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Quantity
                        </Typography>
                        <Stack
                          direction="row"
                          sx={{
                            border: "1px solid",
                            borderColor: "var(--outline-variant)",
                            borderRadius: "0.25rem",
                            height: "40px",
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateLine(
                                line.id,
                                "quantity",
                                Math.max(1, line.quantity - 1),
                              )
                            }
                            sx={{ borderRadius: 0 }}
                          >
                            <RemoveIcon sx={{ fontSize: "18px" }} />
                          </IconButton>
                          <TextField
                            type="number"
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(
                                line.id,
                                "quantity",
                                parsePositiveIntegerFromInput(
                                  event.target.value,
                                  line.quantity,
                                ),
                              )
                            }
                            variant="standard"
                            slotProps={{
                              input: { style: { textAlign: "center" } },
                              htmlInput: { min: 1 },
                            }}
                            sx={{
                              flex: 1,
                              "& .MuiInput-underline:before": {
                                borderBottom: "none",
                              },
                              "& .MuiInput-underline:after": {
                                borderBottom: "none",
                              },
                              "& .MuiInput-underline:hover:before": {
                                borderBottom: "none",
                              },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateLine(line.id, "quantity", line.quantity + 1)
                            }
                            sx={{ borderRadius: 0 }}
                          >
                            <AddIcon sx={{ fontSize: "18px" }} />
                          </IconButton>
                        </Stack>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                        sx={{ mt: 2.5 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: "var(--surface-container-low)",
                        borderRadius: "0.25rem",
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.875rem",
                          }}
                        >
                          <Typography variant="body2">Unit Price</Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: '"Manrope", sans-serif',
                              fontWeight: 700,
                            }}
                          >
                            {formatMoney(unitPrice)}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.875rem",
                            fontWeight: 700,
                          }}
                        >
                          <Typography variant="body2">Subtotal</Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: '"Manrope", sans-serif',
                              fontWeight: 700,
                              color: "var(--primary)",
                            }}
                          >
                            {formatMoney(subtotal)}
                          </Typography>
                        </Box>
                        {deliveryDays && (
                          <Typography
                            variant="caption"
                            sx={{ color: "var(--on-surface-variant)" }}
                          >
                            Est. {deliveryDays} day(s) delivery
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Divider />

        {/* Price Summary */}
        <Box
          sx={{
            backgroundColor: "var(--surface-container-low)",
            p: 2.5,
            borderRadius: "0.5rem",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}
          >
            <Typography variant="body2">Order Total</Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Manrope", sans-serif',
                fontWeight: 800,
                color: "var(--on-surface)",
              }}
            >
              {formatMoney(totalAmount)}
            </Typography>
          </Box>
          {maxDeliveryDays > 0 && (
            <Typography
              variant="caption"
              sx={{ color: "var(--on-surface-variant)" }}
            >
              Longest estimated lead time: {maxDeliveryDays} day(s)
            </Typography>
          )}
        </Box>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {trackingToken && (
          <Alert severity="success">
            Order submitted successfully! Track it here:{" "}
            <Link href={`/track/${encodeURIComponent(trackingToken)}`}>
              /track/{trackingToken}
            </Link>
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            py: 1.5,
            fontWeight: 700,
            fontSize: "0.875rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {isSubmitting ? "Submitting..." : "Place Custom Order"}
        </Button>

        <Typography
          variant="caption"
          sx={{
            textAlign: "center",
            color: "var(--on-surface-variant)",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Secure transaction & architectural guarantee included.
        </Typography>
      </CardContent>
    </Card>
  );
}
