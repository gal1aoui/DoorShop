"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { Box, IconButton, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DoorProductImage } from "@/types/domain";

interface ProductImageCarouselProps {
  images: DoorProductImage[];
  /** @deprecated Prefer aspectRatio + minHeight for flexible layouts */
  height?: number;
  /** CSS aspect-ratio value, e.g. `4 / 3` or `16 / 9` */
  aspectRatio?: string;
  minHeight?: number;
  autoSlideMs?: number;
  activeIndex?: number;
  onActiveIndexChange?: (nextIndex: number) => void;
  disableFrame?: boolean;
}

const SWIPE_THRESHOLD = 40;

export default function ProductImageCarousel({
  images,
  height,
  aspectRatio = "4 / 3",
  minHeight = 180,
  autoSlideMs = 3500,
  activeIndex,
  onActiveIndexChange,
  disableFrame = false,
}: ProductImageCarouselProps) {
  const sortedImages = useMemo(
    () => [...images].sort((left, right) => left.sort_order - right.sort_order),
    [images],
  );
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isControlled = typeof activeIndex === "number";
  const resolvedIndex = isControlled ? activeIndex : internalActiveIndex;

  const updateIndex = useCallback(
    (nextIndex: number) => {
      if (!isControlled) {
        setInternalActiveIndex(nextIndex);
      }
      onActiveIndexChange?.(nextIndex);
    },
    [isControlled, onActiveIndexChange],
  );

  const frameSx = height
    ? {
        height,
        aspectRatio: undefined as string | undefined,
        minHeight: undefined as number | undefined,
      }
    : {
        height: "auto" as const,
        aspectRatio,
        minHeight,
        width: "100%",
      };

  useEffect(() => {
    if (sortedImages.length <= 1) {
      return;
    }

    if (autoSlideMs <= 0) {
      return;
    }

    if (isControlled && !onActiveIndexChange) {
      return;
    }

    const timer = window.setInterval(() => {
      const nextIndex = (resolvedIndex + 1) % sortedImages.length;
      updateIndex(nextIndex);
    }, autoSlideMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    autoSlideMs,
    isControlled,
    onActiveIndexChange,
    resolvedIndex,
    sortedImages.length,
    updateIndex,
  ]);

  useEffect(() => {
    if (resolvedIndex <= sortedImages.length - 1) {
      return;
    }

    updateIndex(0);
  }, [resolvedIndex, sortedImages.length, updateIndex]);

  function goPrevious() {
    const nextIndex =
      resolvedIndex === 0
        ? sortedImages.length - 1
        : Math.max(0, resolvedIndex - 1);
    updateIndex(nextIndex);
  }

  function goNext() {
    const nextIndex = (resolvedIndex + 1) % sortedImages.length;
    updateIndex(nextIndex);
  }

  if (!sortedImages.length) {
    return (
      <Box
        sx={{
          ...frameSx,
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
        borderRadius: disableFrame ? 0 : 2,
        width: "100%",
        ...frameSx,
        border: disableFrame ? "none" : "1px solid",
        borderColor: disableFrame ? "transparent" : "divider",
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
          height: height ? "100%" : "100%",
          width: `${sortedImages.length * 100}%`,
          display: "flex",
          transform: `translateX(-${resolvedIndex * (100 / sortedImages.length)}%)`,
          transition: "transform 450ms ease",
          position: "absolute",
          inset: 0,
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goPrevious();
            }}
            aria-label="Previous image"
            sx={{
              position: "absolute",
              top: "50%",
              left: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0, 0, 0, 0.4)",
              color: "common.white",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.55)" },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            sx={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translateY(-50%)",
              bgcolor: "rgba(0, 0, 0, 0.4)",
              color: "common.white",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.55)" },
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
              bgcolor: "rgba(0, 0, 0, 0.4)",
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
                    index === resolvedIndex
                      ? "primary.main"
                      : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </Stack>
        </>
      ) : null}
    </Box>
  );
}
