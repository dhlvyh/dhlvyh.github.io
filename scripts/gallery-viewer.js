(function (root, factory) {
    const viewer = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = viewer;
    }

    if (root) {
        root.GalleryViewer = viewer;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const CLICK_SUPPRESS_THRESHOLD = 10;

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
        const viewerTrack = viewer.querySelector("#gallery-viewer-track");
        const count = viewer.querySelector("#gallery-viewer-count");
        const prev = viewer.querySelector("#gallery-viewer-prev");
        const next = viewer.querySelector("#gallery-viewer-next");
        const close = viewer.querySelector("#gallery-viewer-close");
        const frame = viewer.querySelector(".gallery-viewer-frame");
        const backdrop = viewer.querySelector("[data-gallery-close]");

        if (sourceItems.length === 0 || !viewerTrack || !count || !prev || !next || !close || !frame || !backdrop) {
            return;
        }

        let activeIndex = 0;
        let railDragState = null;
        let viewerDragState = null;
        let railSnapPoints = [];
        let suppressClickOnce = false;
        let suppressClickResetId = null;
        let pressedItem = null;

        renderViewerTrack();
        syncRailSnapPoints();

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

        function renderViewerTrack() {
            viewerTrack.innerHTML = buildViewerTrackMarkup(sourceItems);
        }

        function setViewerTrackPosition(index, dragDeltaX, useTransition) {
            const slideWidth = frame.clientWidth;
            const translateX = (-index * slideWidth) + dragDeltaX;

            viewerTrack.classList.toggle("is-animating", useTransition);
            viewerTrack.style.transform = "translateX(" + translateX + "px)";
        }

        function updateViewerButtons() {
            prev.disabled = activeIndex === 0;
            next.disabled = activeIndex === sourceItems.length - 1;
        }

        function goToViewerIndex(index, useTransition) {
            activeIndex = window.GalleryUtils.clampIndex(index, sourceItems.length);
            count.textContent = (activeIndex + 1) + " / " + sourceItems.length;
            updateViewerButtons();
            setViewerTrackPosition(activeIndex, 0, useTransition);
        }

        function openViewer(index) {
            viewer.hidden = false;
            viewer.classList.add("is-open");
            document.body.classList.add("gallery-viewer-open");
            goToViewerIndex(index, false);
            close.focus();
        }

        function closeViewer() {
            viewer.classList.remove("is-open");
            viewer.hidden = true;
            document.body.classList.remove("gallery-viewer-open");
            frame.classList.remove("is-dragging");
            viewerDragState = null;
        }

        function moveViewer(offset) {
            goToViewerIndex(activeIndex + offset, true);
        }

        function getPoint(event) {
            return {x: event.clientX, y: event.clientY};
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
            const rawDeltaX = point.x - railDragState.startX;
            const deltaY = point.y - railDragState.startY;
            const maxScrollLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
            const intendedScrollLeft = railDragState.scrollLeft - rawDeltaX;
            const clampedScrollLeft = Math.min(Math.max(intendedScrollLeft, 0), maxScrollLeft);
            const overscroll = intendedScrollLeft - clampedScrollLeft;

            track.scrollLeft = clampedScrollLeft;
            track.style.transform = overscroll === 0
                ? ""
                : "translateX(" + window.GalleryUtils.applyEdgeResistance(-overscroll) + "px)";

            if (window.GalleryUtils.shouldSuppressClick(rawDeltaX, deltaY, CLICK_SUPPRESS_THRESHOLD)) {
                railDragState.hasMoved = true;
            }
        }

        function endRailDrag() {
            if (!railDragState) {
                return;
            }

            const snappedScrollLeft = window.GalleryUtils.findNearestSnapPoint(track.scrollLeft, railSnapPoints);
            suppressClickOnce = railDragState.hasMoved;
            railDragState = null;
            track.classList.remove("is-dragging");
            track.style.transform = "";
            track.scrollTo({left: snappedScrollLeft, behavior: "smooth"});

            if (suppressClickOnce) {
                queueSuppressClickReset();
            }
        }

        function beginViewerDrag(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const point = getPoint(event);
            viewerDragState = {
                startX: point.x,
                lastX: point.x,
                lastTime: Date.now(),
                velocityX: 0,
                dragDeltaX: 0
            };
            viewerTrack.classList.remove("is-animating");
            frame.classList.add("is-dragging");

            if (frame.setPointerCapture && event.pointerId !== undefined) {
                frame.setPointerCapture(event.pointerId);
            }
        }

        function updateViewerDrag(event) {
            if (!viewerDragState) {
                return;
            }

            const point = getPoint(event);
            const rawDeltaX = point.x - viewerDragState.startX;
            const isPastFirst = activeIndex === 0 && rawDeltaX > 0;
            const isPastLast = activeIndex === sourceItems.length - 1 && rawDeltaX < 0;
            const dragDeltaX = isPastFirst || isPastLast
                ? window.GalleryUtils.applyEdgeResistance(rawDeltaX)
                : rawDeltaX;
            const now = Date.now();
            const elapsed = Math.max(now - viewerDragState.lastTime, 1);

            viewerDragState.velocityX = (point.x - viewerDragState.lastX) / elapsed;
            viewerDragState.lastX = point.x;
            viewerDragState.lastTime = now;
            viewerDragState.dragDeltaX = dragDeltaX;
            setViewerTrackPosition(activeIndex, dragDeltaX, false);
        }

        function endViewerDrag() {
            if (!viewerDragState) {
                return;
            }

            const nextIndex = window.GalleryUtils.resolveViewerSnapIndex(
                activeIndex,
                viewerDragState.dragDeltaX,
                viewerDragState.velocityX,
                frame.clientWidth,
                sourceItems.length
            );

            frame.classList.remove("is-dragging");
            viewerDragState = null;
            goToViewerIndex(nextIndex, true);
        }

        function syncRailSnapPoints() {
            railSnapPoints = collectRailSnapPoints(Array.from(track.querySelectorAll(config.itemSelector)));

            const maxScrollLeft = Math.max(track.scrollWidth - track.clientWidth, 0);

            if (maxScrollLeft > 0 && railSnapPoints[railSnapPoints.length - 1] !== maxScrollLeft) {
                railSnapPoints.push(maxScrollLeft);
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

            openViewer(Number(item.dataset.galleryIndex || 0));
        });

        track.addEventListener("pointerdown", beginRailDrag);
        track.addEventListener("pointermove", updateRailDrag);
        track.addEventListener("pointerup", endRailDrag);
        track.addEventListener("pointercancel", endRailDrag);
        track.addEventListener("pointerleave", endRailDrag);

        frame.addEventListener("pointerdown", beginViewerDrag);
        frame.addEventListener("pointermove", updateViewerDrag);
        frame.addEventListener("pointerup", endViewerDrag);
        frame.addEventListener("pointercancel", endViewerDrag);

        prev.addEventListener("click", function () {
            moveViewer(-1);
        });

        next.addEventListener("click", function () {
            moveViewer(1);
        });

        close.addEventListener("click", closeViewer);
        backdrop.addEventListener("click", closeViewer);

        window.addEventListener("resize", function () {
            syncRailSnapPoints();
            if (!viewer.hidden) {
                setViewerTrackPosition(activeIndex, 0, false);
            }
        });

        document.addEventListener("keydown", function (event) {
            if (viewer.hidden) {
                return;
            }

            if (event.key === "Escape") {
                closeViewer();
            } else if (event.key === "ArrowLeft") {
                moveViewer(-1);
            } else if (event.key === "ArrowRight") {
                moveViewer(1);
            }
        });
    }

    function collectSourceItems(itemNodes) {
        return (itemNodes || []).map(function (item) {
            const image = item.querySelector("img");

            if (!image) {
                return null;
            }

            return {src: image.src, fullSrc: item.dataset.fullSrc || image.src, alt: image.alt || ""};
        }).filter(Boolean);
    }

    function collectRailSnapPoints(itemNodes) {
        const points = [];

        (itemNodes || []).forEach(function (node) {
            if (node && typeof node.offsetLeft === "number" && points[points.length - 1] !== node.offsetLeft) {
                points.push(node.offsetLeft);
            }
        });

        return points;
    }

    function buildViewerTrackMarkup(items) {
        return (items || []).map(function (item, index) {
            return [
                '<figure class="gallery-viewer-slide" data-gallery-viewer-slide-index="' + index + '">',
                '<img src="' + escapeHtml(item.fullSrc) + '" alt="' + escapeHtml(item.alt || "") + '"/>',
                "</figure>"
            ].join("");
        }).join("");
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character];
        });
    }

    function resolveActivatedItem(event, track, selector, fallbackItem) {
        const directItem = resolveClosestItem(event && event.target, track, selector);

        if (directItem) {
            return directItem;
        }

        return fallbackItem && track.contains(fallbackItem) ? fallbackItem : null;
    }

    function resolveClosestItem(target, track, selector) {
        if (!target || typeof target.closest !== "function") {
            return null;
        }

        const item = target.closest(selector);
        return item && track.contains(item) ? item : null;
    }

    function rootHasGalleryUtils() {
        return typeof window !== "undefined" && window.GalleryUtils;
    }

    return {initGalleryViewer, collectSourceItems, collectRailSnapPoints, buildViewerTrackMarkup, resolveActivatedItem};
}));
