"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DoorProductImage } from "@/types/domain";

interface ProductImageCarouselProps {
  images: DoorProductImage[];
  height?: number;
  autoSlideMs?: number;
}

const SWIPE_THRESHOLD = 40;

export default function ProductImageCarousel({
  images,
  height = 220,
  autoSlideMs = 3500,
}: ProductImageCarouselProps) {
  const sortedImages = useMemo(
    () => [...images].sort((left, right) => left.sort_order - right.sort_order),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (sortedImages.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sortedImages.length);
    }, autoSlideMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoSlideMs, sortedImages.length]);

  useEffect(() => {
    if (activeIndex <= sortedImages.length - 1) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, sortedImages.length]);

  function goPrevious() {
    setActiveIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : Math.max(0, prev - 1),
    );
  }

  function goNext() {
    setActiveIndex((prev) => (prev + 1) % sortedImages.length);
  }

  if (!sortedImages.length) {
    return (
      <Box
        sx={{
          height,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        height,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX ?? null;
        touchStartX.current = null;

        if (startX === null || endX === null) {
          return;
        }

        const delta = endX - startX;
        if (Math.abs(delta) < SWIPE_THRESHOLD) {
          return;
        }

        if (delta < 0) {
          goNext();
        } else {
          goPrevious();
        }
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${sortedImages.length * 100}%`,
          display: "flex",
          transform: `translateX(-${activeIndex * (100 / sortedImages.length)}%)`,
          transition: "transform 450ms ease",
        }}
      >
        {sortedImages.map((image) => (
          <Box
            key={image.id}
            component="img"
            src={image.public_url}
            alt={image.alt_text ?? "Door product image"}
            loading="lazy"
            sx={{
              width: `${100 / sortedImages.length}%`,
              height: "100%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ))}
      </Box>

      {sortedImages.length > 1 ? (
        <>
          <IconButton
            size="small"
            onClick={goPrevious}
            sx={{
              position: "absolute",
              top: "50%",
              left: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0, 0, 0, 0.35)",
              color: "common.white",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.5)" },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={goNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0, 0, 0, 0.35)",
              color: "common.white",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.5)" },
            }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
          <Stack
            direction="row"
            spacing={0.8}
            sx={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              px: 1,
              py: 0.5,
              borderRadius: 20,
              bgcolor: "rgba(0, 0, 0, 0.35)",
            }}
          >
            {sortedImages.map((image, index) => (
              <Box
                key={image.id}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor:
                    index === activeIndex
                      ? "common.white"
                      : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </Stack>
        </>
      ) : null}
    </Box>
  );
}
