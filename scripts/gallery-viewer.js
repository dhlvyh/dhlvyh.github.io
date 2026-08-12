// 갤러리 메인 뷰어 — full-bleed 스와이프 트랙과 5열 썸네일 그리드를 양방향으로 동기화한다
(function (root, factory) {
    const gallery = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = gallery;
    }

    if (root) {
        root.GalleryViewer = gallery;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function initGallery(config) {
        if (typeof document === "undefined" || typeof window === "undefined" || !window.GalleryUtils) {
            return;
        }

        const viewport = document.querySelector(config.viewportSelector);
        const track = document.querySelector(config.trackSelector);
        const thumbGrid = document.querySelector(config.thumbGridSelector);
        const prev = document.querySelector(config.prevSelector);
        const next = document.querySelector(config.nextSelector);

        if (!viewport || !track || !thumbGrid) {
            return;
        }

        const slides = Array.from(track.children);
        const thumbs = Array.from(thumbGrid.children);
        const length = slides.length;

        if (length === 0) {
            return;
        }

        let activeIndex = 0;
        let dragState = null;

        function setTrackPosition(index, dragDeltaX, useTransition) {
            const slideWidth = viewport.clientWidth;
            const translateX = (-index * slideWidth) + dragDeltaX;

            track.classList.toggle("is-animating", useTransition);
            track.style.transform = "translateX(" + translateX + "px)";
        }

        function updateNavButtons() {
            if (prev) {
                prev.disabled = length <= 1;
            }

            if (next) {
                next.disabled = length <= 1;
            }
        }

        function updateActiveThumb() {
            thumbs.forEach(function (thumb, index) {
                const isActive = index === activeIndex;

                thumb.classList.toggle("is-active", isActive);

                if (isActive) {
                    thumb.setAttribute("aria-current", "true");
                } else {
                    thumb.removeAttribute("aria-current");
                }
            });
        }

        function goToIndex(index, useTransition) {
            activeIndex = window.GalleryUtils.clampIndex(index, length);
            setTrackPosition(activeIndex, 0, useTransition);
            updateActiveThumb();
        }

        function getPoint(event) {
            return {x: event.clientX, y: event.clientY};
        }

        function beginDrag(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const point = getPoint(event);
            dragState = {
                startX: point.x,
                lastX: point.x,
                lastTime: Date.now(),
                velocityX: 0,
                dragDeltaX: 0
            };
            track.classList.remove("is-animating");
            track.classList.add("is-dragging");

            if (track.setPointerCapture && event.pointerId !== undefined) {
                track.setPointerCapture(event.pointerId);
            }
        }

        function updateDrag(event) {
            if (!dragState) {
                return;
            }

            if (event.cancelable) {
                event.preventDefault();
            }

            const point = getPoint(event);
            const rawDeltaX = point.x - dragState.startX;
            const isPastFirst = activeIndex === 0 && rawDeltaX > 0;
            const isPastLast = activeIndex === length - 1 && rawDeltaX < 0;
            const dragDeltaX = isPastFirst || isPastLast
                ? window.GalleryUtils.applyEdgeResistance(rawDeltaX)
                : rawDeltaX;
            const now = Date.now();
            const elapsed = Math.max(now - dragState.lastTime, 1);

            dragState.velocityX = (point.x - dragState.lastX) / elapsed;
            dragState.lastX = point.x;
            dragState.lastTime = now;
            dragState.dragDeltaX = dragDeltaX;
            setTrackPosition(activeIndex, dragDeltaX, false);
        }

        function endDrag() {
            if (!dragState) {
                return;
            }

            const nextIndex = window.GalleryUtils.resolveSnapIndex(
                activeIndex,
                dragState.dragDeltaX,
                dragState.velocityX,
                viewport.clientWidth,
                length
            );

            track.classList.remove("is-dragging");
            dragState = null;
            goToIndex(nextIndex, true);
        }

        track.addEventListener("pointerdown", beginDrag);
        track.addEventListener("pointermove", updateDrag);
        track.addEventListener("pointerup", endDrag);
        track.addEventListener("pointercancel", endDrag);
        track.addEventListener("pointerleave", endDrag);

        thumbGrid.addEventListener("click", function (event) {
            const thumb = event.target.closest("[data-gallery-thumb-index]");

            if (!thumb) {
                return;
            }

            goToIndex(Number(thumb.dataset.galleryThumbIndex), true);
        });

        if (prev) {
            prev.addEventListener("click", function () {
                goToIndex(activeIndex - 1, true);
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                goToIndex(activeIndex + 1, true);
            });
        }

        window.addEventListener("resize", function () {
            setTrackPosition(activeIndex, 0, false);
        });

        updateNavButtons();
        goToIndex(0, false);
    }

    return {initGallery};
}));
