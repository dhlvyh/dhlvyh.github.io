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

    function applyEdgeResistance(distance, resistanceFactor = 0.35) {
        return distance * resistanceFactor;
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
            return length <= 0 ? 0 : activeIndex;
        }

        const distanceThreshold = slideWidth * distanceThresholdRatio;

        if (dragDeltaX <= -distanceThreshold || velocityX <= -velocityThreshold) {
            return getWrappedIndex(activeIndex, "next", length);
        }

        if (dragDeltaX >= distanceThreshold || velocityX >= velocityThreshold) {
            return getWrappedIndex(activeIndex, "previous", length);
        }

        return activeIndex;
    }

    function resolveScrubPosition(clientX, trackLeft, trackWidth, length) {
        if (length <= 1 || trackWidth <= 0) {
            return 0;
        }

        const fraction = Math.min(Math.max((clientX - trackLeft) / trackWidth, 0), 1);
        return fraction * (length - 1);
    }

    return {
        resolveSwipeAction,
        getWrappedIndex,
        shouldSuppressClick,
        applyEdgeResistance,
        resolveSnapIndex,
        resolveScrubPosition
    };
}));
