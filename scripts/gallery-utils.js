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

    return {
        resolveSwipeAction,
        getWrappedIndex,
        shouldSuppressClick,
        buildLoopedItems,
        normalizeLoopedScroll
    };
}));
