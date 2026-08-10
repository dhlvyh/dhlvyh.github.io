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

    function findNearestSnapPoint(scrollLeft, snapPoints) {
        const points = Array.isArray(snapPoints) ? snapPoints : [];

        if (points.length === 0) {
            return 0;
        }

        return points.reduce(function (closest, point) {
            return Math.abs(point - scrollLeft) < Math.abs(closest - scrollLeft) ? point : closest;
        }, points[0]);
    }

    function resolvePerPage(viewportWidth, breakpoint = 768, desktopCount = 10, mobileCount = 4) {
        return viewportWidth > breakpoint ? desktopCount : mobileCount;
    }

    function buildPages(itemCount, perPage) {
        if (itemCount <= 0 || perPage <= 0) {
            return [];
        }

        const pages = [];

        for (let startIndex = 0; startIndex < itemCount; startIndex += perPage) {
            const page = [];

            for (let index = startIndex; index < Math.min(startIndex + perPage, itemCount); index += 1) {
                page.push(index);
            }

            pages.push(page);
        }

        return pages;
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
        findNearestSnapPoint,
        resolvePerPage,
        buildPages
    };
}));
