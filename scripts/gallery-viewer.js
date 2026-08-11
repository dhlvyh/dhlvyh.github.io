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
        const pagerRoot = track.closest(".gallery-pager");
        const pagerViewport = pagerRoot ? pagerRoot.querySelector(".gallery-pager-viewport") : null;
        const pagerPrev = pagerRoot ? pagerRoot.querySelector("#gallery-pager-prev") : null;
        const pagerNext = pagerRoot ? pagerRoot.querySelector("#gallery-pager-next") : null;
        const pagerDots = pagerRoot ? pagerRoot.querySelector("#gallery-pager-dots") : null;

        if (
            sourceItems.length === 0 || !viewerTrack || !count || !prev || !next || !close || !frame || !backdrop ||
            !pagerViewport || !pagerPrev || !pagerNext || !pagerDots
        ) {
            return;
        }

        let activeIndex = 0;
        let viewerDragState = null;
        let suppressClickOnce = false;
        let suppressClickResetId = null;
        let pressedItem = null;
        let cardNodes = sourceNodes;
        let pages = [];
        let activePage = 0;
        let currentPerPage = null;
        let pagerDragState = null;

        renderViewerTrack();
        renderPages();
        goToPage(0, false);

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
            const slideWidth = viewerTrack.clientWidth;
            const translateX = (-index * slideWidth) + dragDeltaX;

            viewerTrack.classList.toggle("is-animating", useTransition);
            viewerTrack.style.transform = "translateX(" + translateX + "px)";
        }

        function updateViewerButtons() {
            prev.disabled = sourceItems.length <= 1;
            next.disabled = sourceItems.length <= 1;
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

            const nextIndex = window.GalleryUtils.resolveSnapIndex(
                activeIndex,
                viewerDragState.dragDeltaX,
                viewerDragState.velocityX,
                viewerTrack.clientWidth,
                sourceItems.length
            );

            frame.classList.remove("is-dragging");
            viewerDragState = null;
            goToViewerIndex(nextIndex, true);
        }

        function renderPages() {
            const perPage = window.GalleryUtils.resolvePerPage(window.innerWidth);

            if (perPage === currentPerPage) {
                return false;
            }

            currentPerPage = perPage;
            pages = window.GalleryUtils.buildPages(cardNodes.length, perPage);

            track.innerHTML = "";

            pages.forEach(function (pageIndexes) {
                const pageElement = document.createElement("div");
                pageElement.className = "gallery-pager-page";

                pageIndexes.forEach(function (cardIndex) {
                    pageElement.appendChild(cardNodes[cardIndex]);
                });

                track.appendChild(pageElement);
            });

            renderDots();
            return true;
        }

        function renderDots() {
            pagerDots.innerHTML = pages.map(function (_, index) {
                return '<button class="gallery-pager-dot" type="button" data-gallery-pager-dot-index="' +
                    index + '" aria-label="' + (index + 1) + ' 페이지"></button>';
            }).join("");
        }

        function updatePagerDots() {
            Array.from(pagerDots.children).forEach(function (dot, index) {
                dot.classList.toggle("is-active", index === activePage);
            });
        }

        function updatePagerButtons() {
            pagerPrev.disabled = activePage <= 0;
            pagerNext.disabled = activePage >= pages.length - 1;
        }

        function setPagerTrackPosition(index, dragDeltaX, useTransition) {
            const pageWidth = pagerViewport.clientWidth;
            const translateX = (-index * pageWidth) + dragDeltaX;

            track.classList.toggle("is-animating", useTransition);
            track.style.transform = "translateX(" + translateX + "px)";
        }

        function goToPage(index, useTransition) {
            activePage = window.GalleryUtils.clampIndex(index, pages.length);
            updatePagerButtons();
            updatePagerDots();
            setPagerTrackPosition(activePage, 0, useTransition);
        }

        function beginPagerDrag(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const point = getPoint(event);
            clearSuppressClickReset();
            suppressClickOnce = false;
            pressedItem = resolveClosestItem(event.target, track, config.itemSelector);
            pagerDragState = {
                startX: point.x,
                startY: point.y,
                lastX: point.x,
                lastTime: Date.now(),
                velocityX: 0,
                dragDeltaX: 0,
                hasMoved: false
            };
            track.classList.remove("is-animating");
            track.classList.add("is-dragging");

            if (track.setPointerCapture && event.pointerId !== undefined) {
                track.setPointerCapture(event.pointerId);
            }
        }

        function updatePagerDrag(event) {
            if (!pagerDragState) {
                return;
            }

            if (event.cancelable) {
                event.preventDefault();
            }

            const point = getPoint(event);
            const rawDeltaX = point.x - pagerDragState.startX;
            const deltaY = point.y - pagerDragState.startY;
            const isPastFirst = activePage === 0 && rawDeltaX > 0;
            const isPastLast = activePage === pages.length - 1 && rawDeltaX < 0;
            const dragDeltaX = isPastFirst || isPastLast
                ? window.GalleryUtils.applyEdgeResistance(rawDeltaX)
                : rawDeltaX;
            const now = Date.now();
            const elapsed = Math.max(now - pagerDragState.lastTime, 1);

            pagerDragState.velocityX = (point.x - pagerDragState.lastX) / elapsed;
            pagerDragState.lastX = point.x;
            pagerDragState.lastTime = now;
            pagerDragState.dragDeltaX = dragDeltaX;

            if (window.GalleryUtils.shouldSuppressClick(rawDeltaX, deltaY, CLICK_SUPPRESS_THRESHOLD)) {
                pagerDragState.hasMoved = true;
            }

            setPagerTrackPosition(activePage, dragDeltaX, false);
        }

        function endPagerDrag() {
            if (!pagerDragState) {
                return;
            }

            const nextIndex = window.GalleryUtils.resolveSnapIndex(
                activePage,
                pagerDragState.dragDeltaX,
                pagerDragState.velocityX,
                pagerViewport.clientWidth,
                pages.length
            );

            suppressClickOnce = pagerDragState.hasMoved;
            track.classList.remove("is-dragging");
            pagerDragState = null;
            goToPage(nextIndex, true);

            if (suppressClickOnce) {
                queueSuppressClickReset();
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

        track.addEventListener("pointerdown", beginPagerDrag);
        track.addEventListener("pointermove", updatePagerDrag);
        track.addEventListener("pointerup", endPagerDrag);
        track.addEventListener("pointercancel", endPagerDrag);
        track.addEventListener("pointerleave", endPagerDrag);

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

        pagerPrev.addEventListener("click", function () {
            goToPage(activePage - 1, true);
        });

        pagerNext.addEventListener("click", function () {
            goToPage(activePage + 1, true);
        });

        pagerDots.addEventListener("click", function (event) {
            const dot = event.target.closest("[data-gallery-pager-dot-index]");

            if (!dot) {
                return;
            }

            goToPage(Number(dot.dataset.galleryPagerDotIndex), true);
        });

        window.addEventListener("resize", function () {
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

    return {initGalleryViewer, collectSourceItems, buildViewerTrackMarkup, resolveActivatedItem};
}));
