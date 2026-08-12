(function (root, factory) {
    const utils = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = utils;
    }

    if (root) {
        root.GalleryUtils = utils;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function resolveSwipeAction(deltaX, threshold) {
        if (deltaX <= -threshold) {
            return "next";
        }

        if (deltaX >= threshold) {
            return "previous";
        }

        return "stay";
    }

    function getWrappedIndex(currentIndex, action, length) {
        if (length <= 0) {
            return 0;
        }

        if (action === "next") {
            return (currentIndex + 1) % length;
        }

        if (action === "previous") {
            return (currentIndex - 1 + length) % length;
        }

        return currentIndex;
    }

    function shouldSuppressClick(deltaX, deltaY, threshold) {
        return Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;
    }

    function buildLoopedItems(items, repeatCount) {
        const safeItems = Array.isArray(items) ? items : [];
        const safeRepeatCount = Math.max(1, repeatCount || 1);
        const loopedItems = [];

        for (let segmentIndex = 0; segmentIndex < safeRepeatCount; segmentIndex += 1) {
            safeItems.forEach(function (item, originIndex) {
                loopedItems.push(Object.assign({}, item, {
                    segmentIndex,
                    originIndex
                }));
            });
        }

        return loopedItems;
    }

    function normalizeLoopedScroll(scrollLeft, segmentStart, segmentWidth) {
        if (segmentWidth <= 0) {
            return scrollLeft;
        }

        let nextScrollLeft = scrollLeft;

        while (nextScrollLeft < segmentStart) {
            nextScrollLeft += segmentWidth;
        }

        while (nextScrollLeft >= segmentStart + segmentWidth) {
            nextScrollLeft -= segmentWidth;
        }

        return nextScrollLeft;
    }

    function applyEdgeResistance(distance, resistanceFactor = 0.35) {
        return distance * resistanceFactor;
    }

    function clampIndex(index, length) {
        if (length <= 0) {
            return 0;
        }

        return Math.min(Math.max(index, 0), length - 1);
    }

    function resolveSnapIndex(
        activeIndex,
        dragDeltaX,
        velocityX,
        slideWidth,
        length,
        distanceThresholdRatio = 0.18,
        velocityThreshold = 0.45
    ) {
        if (length <= 1 || slideWidth <= 0) {
            return clampIndex(activeIndex, length);
        }

        const distanceThreshold = slideWidth * distanceThresholdRatio;

        if (dragDeltaX <= -distanceThreshold || velocityX <= -velocityThreshold) {
            return clampIndex(activeIndex + 1, length);
        }

        if (dragDeltaX >= distanceThreshold || velocityX >= velocityThreshold) {
            return clampIndex(activeIndex - 1, length);
        }

        return clampIndex(activeIndex, length);
    }

    function computeContainSize(containerWidth, containerHeight, contentWidth, contentHeight) {
        if (containerWidth <= 0 || containerHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) {
            return {width: 0, height: 0};
        }

        const containerRatio = containerWidth / containerHeight;
        const contentRatio = contentWidth / contentHeight;

        if (contentRatio > containerRatio) {
            return {width: containerWidth, height: containerWidth / contentRatio};
        }

        return {width: containerHeight * contentRatio, height: containerHeight};
    }

    function clampPanOffset(offset, scale, containerSize, contentSize) {
        const maxOffset = Math.max(0, (contentSize * scale - containerSize) / 2);
        return Math.min(Math.max(offset, -maxOffset), maxOffset);
    }

    function computePinchDistance(pointA, pointB) {
        return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    }

    function computePinchMidpointPercent(pointA, pointB, rect) {
        if (rect.width <= 0 || rect.height <= 0) {
            return {x: 50, y: 50};
        }

        const midX = (pointA.x + pointB.x) / 2;
        const midY = (pointA.y + pointB.y) / 2;
        const xPercent = ((midX - rect.left) / rect.width) * 100;
        const yPercent = ((midY - rect.top) / rect.height) * 100;

        return {
            x: Math.min(Math.max(xPercent, 0), 100),
            y: Math.min(Math.max(yPercent, 0), 100)
        };
    }

    function clampZoomScale(scale, min = 1, max = 3) {
        return Math.min(Math.max(scale, min), max);
    }

    return {
        resolveSwipeAction,
        getWrappedIndex,
        shouldSuppressClick,
        buildLoopedItems,
        normalizeLoopedScroll,
        applyEdgeResistance,
        clampIndex,
        resolveSnapIndex,
        computeContainSize,
        clampPanOffset,
        computePinchDistance,
        computePinchMidpointPercent,
        clampZoomScale
    };
}));
