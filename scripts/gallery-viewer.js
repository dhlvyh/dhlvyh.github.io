(function (root, factory) {
    const viewer = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = viewer;
    }

    if (root) {
        root.GalleryViewer = viewer;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const SWIPE_THRESHOLD = 60;
    const CLICK_SUPPRESS_THRESHOLD = 10;
    const LOOP_REPEAT_COUNT = 3;

    function initGalleryViewer(config) {
        if (typeof document === "undefined" || typeof window === "undefined") {
            return;
        }

        const track = document.querySelector(config.trackSelector);
        const viewer = document.querySelector(config.viewerSelector);
        const sourceNodes = Array.from(document.querySelectorAll(config.itemSelector));

        if (!track || !viewer || sourceNodes.length === 0 || !rootHasGalleryUtils()) {
            return;
        }

        const sourceItems = collectSourceItems(sourceNodes);

        if (sourceItems.length === 0) {
            return;
        }

        const viewerTrack = viewer.querySelector("#gallery-viewer-track");
        let image = viewer.querySelector("#gallery-viewer-image");

        if (!image && viewerTrack) {
            image = document.createElement("img");
            image.id = "gallery-viewer-image";
            viewerTrack.appendChild(image);
        }

        const count = viewer.querySelector("#gallery-viewer-count");
        const prev = viewer.querySelector("#gallery-viewer-prev");
        const next = viewer.querySelector("#gallery-viewer-next");
        const close = viewer.querySelector("#gallery-viewer-close");
        const frame = viewer.querySelector(".gallery-viewer-frame");
        const backdrop = viewer.querySelector("[data-gallery-close]");

        if (!image || !count || !prev || !next || !close || !frame || !backdrop) {
            return;
        }

        let activeIndex = 0;
        let railDragState = null;
        let viewerDragState = null;
        let loopMetrics = null;
        let isNormalizing = false;
        let suppressClickOnce = false;
        let suppressClickResetId = null;
        let pressedItem = null;

        renderLoopedTrack();
        syncLoopMetrics(true);

        function clearSuppressClickReset() {
            if (suppressClickResetId) {
                window.clearTimeout(suppressClickResetId);
                suppressClickResetId = null;
            }
        }

        function queueSuppressClickReset() {
            clearSuppressClickReset();
            suppressClickResetId = window.setTimeout(function () {
                suppressClickOnce = false;
                suppressClickResetId = null;
            }, 150);
        }

        function renderLoopedTrack() {
            const loopedItems = window.GalleryUtils.buildLoopedItems(sourceItems, LOOP_REPEAT_COUNT);

            track.innerHTML = "";

            loopedItems.forEach(function (item) {
                const button = document.createElement("button");
                const preview = document.createElement("img");

                button.className = "gallery-card";
                button.type = "button";
                button.setAttribute("data-gallery-item", "");
                button.setAttribute("data-gallery-origin-index", String(item.originIndex));
                button.setAttribute("data-gallery-segment-index", String(item.segmentIndex));
                button.setAttribute("data-full-src", item.fullSrc);
                button.setAttribute("aria-label", item.alt);

                preview.className = "img-fluid";
                preview.src = item.src;
                preview.alt = item.alt;

                button.appendChild(preview);
                track.appendChild(button);
            });
        }

        function syncLoopMetrics(resetToCenter) {
            const loopedNodes = Array.from(track.querySelectorAll(config.itemSelector));
            loopMetrics = deriveLoopMetrics(loopedNodes);

            if (!loopMetrics) {
                return;
            }

            if (resetToCenter || track.scrollLeft === 0) {
                track.scrollLeft = loopMetrics.segmentStart;
                return;
            }

            track.scrollLeft = window.GalleryUtils.normalizeLoopedScroll(
                track.scrollLeft,
                loopMetrics.segmentStart,
                loopMetrics.segmentWidth
            );
        }

        function releaseNormalizationLock() {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(function () {
                    isNormalizing = false;
                });
                return;
            }

            window.setTimeout(function () {
                isNormalizing = false;
            }, 0);
        }

        function normalizeTrackScroll() {
            if (!loopMetrics || isNormalizing) {
                return;
            }

            const nextScrollLeft = window.GalleryUtils.normalizeLoopedScroll(
                track.scrollLeft,
                loopMetrics.segmentStart,
                loopMetrics.segmentWidth
            );

            if (nextScrollLeft === track.scrollLeft) {
                return;
            }

            isNormalizing = true;
            track.scrollLeft = nextScrollLeft;
            releaseNormalizationLock();
        }

        function renderActive() {
            const currentItem = sourceItems[activeIndex];

            image.src = currentItem.fullSrc;
            image.alt = currentItem.alt;
            count.textContent = (activeIndex + 1) + " / " + sourceItems.length;

            const disableNavigation = sourceItems.length <= 1;
            prev.disabled = disableNavigation;
            next.disabled = disableNavigation;
        }

        function openViewer(index) {
            activeIndex = index;
            renderActive();
            viewer.hidden = false;
            viewer.classList.add("is-open");
            document.body.classList.add("gallery-viewer-open");
            close.focus();
        }

        function closeViewer() {
            viewer.classList.remove("is-open");
            viewer.hidden = true;
            document.body.classList.remove("gallery-viewer-open");
            frame.classList.remove("is-dragging");
            viewerDragState = null;
        }

        function moveViewer(action) {
            if (sourceItems.length <= 1) {
                return;
            }

            activeIndex = window.GalleryUtils.getWrappedIndex(activeIndex, action, sourceItems.length);
            renderActive();
        }

        function getPoint(event) {
            return {
                x: event.clientX,
                y: event.clientY
            };
        }

        function beginRailDrag(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const point = getPoint(event);

            clearSuppressClickReset();
            suppressClickOnce = false;
            pressedItem = resolveClosestItem(event.target, track, config.itemSelector);
            railDragState = {
                startX: point.x,
                startY: point.y,
                scrollLeft: track.scrollLeft,
                hasMoved: false
            };

            track.classList.add("is-dragging");

            if (track.setPointerCapture && event.pointerId !== undefined) {
                track.setPointerCapture(event.pointerId);
            }
        }

        function updateRailDrag(event) {
            if (!railDragState) {
                return;
            }

            const point = getPoint(event);
            const deltaX = point.x - railDragState.startX;
            const deltaY = point.y - railDragState.startY;

            track.scrollLeft = railDragState.scrollLeft - deltaX;

            if (window.GalleryUtils.shouldSuppressClick(deltaX, deltaY, CLICK_SUPPRESS_THRESHOLD)) {
                railDragState.hasMoved = true;
            }
        }

        function endRailDrag() {
            if (!railDragState) {
                return;
            }

            suppressClickOnce = railDragState.hasMoved;
            railDragState = null;
            track.classList.remove("is-dragging");

            if (suppressClickOnce) {
                queueSuppressClickReset();
            }
        }

        function beginViewerDrag(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            viewerDragState = {
                startX: getPoint(event).x
            };
            frame.classList.add("is-dragging");

            if (frame.setPointerCapture && event.pointerId !== undefined) {
                frame.setPointerCapture(event.pointerId);
            }
        }

        function endViewerDrag(event) {
            if (!viewerDragState) {
                return;
            }

            const deltaX = getPoint(event).x - viewerDragState.startX;
            const action = window.GalleryUtils.resolveSwipeAction(deltaX, SWIPE_THRESHOLD);

            frame.classList.remove("is-dragging");
            viewerDragState = null;

            if (action !== "stay") {
                moveViewer(action);
            }
        }

        track.addEventListener("click", function (event) {
            const item = resolveActivatedItem(event, track, config.itemSelector, pressedItem);

            pressedItem = null;

            if (!item || !track.contains(item)) {
                return;
            }

            if (suppressClickOnce) {
                event.preventDefault();
                suppressClickOnce = false;
                clearSuppressClickReset();
                return;
            }

            openViewer(Number(item.dataset.galleryOriginIndex || item.dataset.galleryIndex || 0));
        });

        track.addEventListener("scroll", normalizeTrackScroll);
        track.addEventListener("pointerdown", beginRailDrag);
        track.addEventListener("pointermove", updateRailDrag);
        track.addEventListener("pointerup", endRailDrag);
        track.addEventListener("pointercancel", endRailDrag);
        track.addEventListener("pointerleave", endRailDrag);

        frame.addEventListener("pointerdown", beginViewerDrag);
        frame.addEventListener("pointerup", endViewerDrag);
        frame.addEventListener("pointercancel", function () {
            frame.classList.remove("is-dragging");
            viewerDragState = null;
        });

        prev.addEventListener("click", function () {
            moveViewer("previous");
        });

        next.addEventListener("click", function () {
            moveViewer("next");
        });

        close.addEventListener("click", closeViewer);
        backdrop.addEventListener("click", closeViewer);

        window.addEventListener("resize", function () {
            syncLoopMetrics(true);
        });

        document.addEventListener("keydown", function (event) {
            if (viewer.hidden) {
                return;
            }

            if (event.key === "Escape") {
                closeViewer();
            } else if (event.key === "ArrowLeft") {
                moveViewer("previous");
            } else if (event.key === "ArrowRight") {
                moveViewer("next");
            }
        });
    }

    function collectSourceItems(itemNodes) {
        return (itemNodes || []).map(function (item) {
            const image = item.querySelector("img");

            if (!image) {
                return null;
            }

            return {
                src: image.src,
                fullSrc: item.dataset.fullSrc || image.src,
                alt: image.alt || ""
            };
        }).filter(Boolean);
    }

    function collectRailSnapPoints(itemNodes) {
        const points = [];

        (itemNodes || []).forEach(function (node) {
            if (!node || typeof node.offsetLeft !== "number") {
                return;
            }

            if (points[points.length - 1] !== node.offsetLeft) {
                points.push(node.offsetLeft);
            }
        });

        return points;
    }

    function buildViewerTrackMarkup(items) {
        return (items || []).map(function (item, index) {
            return [
                '<figure class="gallery-viewer-slide" data-gallery-viewer-slide-index="' + index + '">',
                '<img src="' + item.fullSrc + '" alt="' + (item.alt || "") + '"/>',
                "</figure>"
            ].join("");
        }).join("");
    }

    function deriveLoopMetrics(loopedNodes) {
        if (!Array.isArray(loopedNodes) || loopedNodes.length === 0) {
            return null;
        }

        const segmentStarts = [];

        loopedNodes.forEach(function (node) {
            const segmentIndex = Number(node.dataset.gallerySegmentIndex);

            if (Number.isNaN(segmentIndex) || segmentStarts[segmentIndex] !== undefined) {
                return;
            }

            segmentStarts[segmentIndex] = node.offsetLeft;
        });

        if (
            segmentStarts[0] === undefined ||
            segmentStarts[1] === undefined ||
            segmentStarts[2] === undefined
        ) {
            return null;
        }

        const segmentStart = segmentStarts[1] - segmentStarts[0];
        const segmentWidth = segmentStarts[2] - segmentStarts[1];

        if (segmentWidth <= 0) {
            return null;
        }

        return {
            segmentStart,
            segmentWidth
        };
    }

    function resolveActivatedItem(event, track, selector, fallbackItem) {
        const directItem = resolveClosestItem(event && event.target, track, selector);

        if (directItem) {
            return directItem;
        }

        if (fallbackItem && track.contains(fallbackItem)) {
            return fallbackItem;
        }

        return null;
    }

    function resolveClosestItem(target, track, selector) {
        if (!target || typeof target.closest !== "function") {
            return null;
        }

        const item = target.closest(selector);

        if (!item || !track.contains(item)) {
            return null;
        }

        return item;
    }

    function rootHasGalleryUtils() {
        return typeof window !== "undefined" && window.GalleryUtils;
    }

    return {
        initGalleryViewer,
        collectSourceItems,
        collectRailSnapPoints,
        buildViewerTrackMarkup,
        deriveLoopMetrics,
        resolveActivatedItem
    };
}));
