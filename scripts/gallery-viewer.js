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
        let panState = null;
        let pinchState = null;
        const activePointers = new Map();
        const zoomStates = slides.map(function () {
            return {scale: 1, panX: 0, panY: 0};
        });

        function getActivePhoto() {
            return slides[activeIndex].querySelector(".gallery-main-slide-photo");
        }

        function applyZoomTransform(index) {
            const state = zoomStates[index];
            const photo = slides[index].querySelector(".gallery-main-slide-photo");

            if (!photo) {
                return;
            }

            photo.style.transform = state.scale === 1 && state.panX === 0 && state.panY === 0
                ? ""
                : "translate(" + state.panX + "px, " + state.panY + "px) scale(" + state.scale + ")";
        }

        function resetZoom(index) {
            zoomStates[index] = {scale: 1, panX: 0, panY: 0};

            const photo = slides[index].querySelector(".gallery-main-slide-photo");

            if (photo) {
                photo.style.transform = "";
                photo.style.transformOrigin = "50% 50%";
            }
        }

        function clampActivePan() {
            const state = zoomStates[activeIndex];
            const photo = getActivePhoto();

            if (!photo || photo.naturalWidth === 0) {
                return;
            }

            const containSize = window.GalleryUtils.computeContainSize(
                viewport.clientWidth,
                viewport.clientHeight,
                photo.naturalWidth,
                photo.naturalHeight
            );

            state.panX = window.GalleryUtils.clampPanOffset(state.panX, state.scale, viewport.clientWidth, containSize.width);
            state.panY = window.GalleryUtils.clampPanOffset(state.panY, state.scale, viewport.clientHeight, containSize.height);
        }

        function finishZoomGesture() {
            if (zoomStates[activeIndex].scale <= 1) {
                resetZoom(activeIndex);
            }
        }

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
            if (zoomStates[activeIndex].scale > 1) {
                resetZoom(activeIndex);
            }

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

        function onPointerDown(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            activePointers.set(event.pointerId, getPoint(event));

            if (track.setPointerCapture && event.pointerId !== undefined) {
                track.setPointerCapture(event.pointerId);
            }

            if (activePointers.size === 1) {
                if (zoomStates[activeIndex].scale > 1) {
                    const point = getPoint(event);

                    panState = {
                        startX: point.x,
                        startY: point.y,
                        startPanX: zoomStates[activeIndex].panX,
                        startPanY: zoomStates[activeIndex].panY
                    };
                } else {
                    beginDrag(event);
                }

                return;
            }

            if (activePointers.size === 2) {
                if (dragState) {
                    track.classList.remove("is-dragging");
                    dragState = null;
                    setTrackPosition(activeIndex, 0, false);
                }

                panState = null;

                const points = Array.from(activePointers.values());
                const photo = getActivePhoto();

                if (!photo) {
                    return;
                }

                const rect = photo.getBoundingClientRect();
                const midpoint = window.GalleryUtils.computePinchMidpointPercent(points[0], points[1], rect);

                photo.style.transformOrigin = midpoint.x + "% " + midpoint.y + "%";
                pinchState = {
                    initialDistance: window.GalleryUtils.computePinchDistance(points[0], points[1]),
                    initialScale: zoomStates[activeIndex].scale
                };
            }
        }

        function onPointerMove(event) {
            if (!activePointers.has(event.pointerId)) {
                return;
            }

            activePointers.set(event.pointerId, getPoint(event));

            if (pinchState && activePointers.size >= 2) {
                const photo = getActivePhoto();

                if (!photo || photo.naturalWidth === 0) {
                    return;
                }

                if (event.cancelable) {
                    event.preventDefault();
                }

                const points = Array.from(activePointers.values()).slice(0, 2);
                const currentDistance = window.GalleryUtils.computePinchDistance(points[0], points[1]);
                const scale = window.GalleryUtils.clampZoomScale(
                    pinchState.initialScale * (currentDistance / pinchState.initialDistance),
                    1,
                    3
                );

                zoomStates[activeIndex].scale = scale;
                clampActivePan();
                applyZoomTransform(activeIndex);
                return;
            }

            if (panState) {
                const photo = getActivePhoto();

                if (!photo || photo.naturalWidth === 0) {
                    return;
                }

                if (event.cancelable) {
                    event.preventDefault();
                }

                const state = zoomStates[activeIndex];

                state.panX = panState.startPanX + (event.clientX - panState.startX);
                state.panY = panState.startPanY + (event.clientY - panState.startY);
                clampActivePan();
                applyZoomTransform(activeIndex);
                return;
            }

            updateDrag(event);
        }

        function onPointerUp(event) {
            activePointers.delete(event.pointerId);

            if (pinchState) {
                if (activePointers.size < 2) {
                    pinchState = null;

                    if (activePointers.size === 1) {
                        const remaining = Array.from(activePointers.values())[0];

                        panState = {
                            startX: remaining.x,
                            startY: remaining.y,
                            startPanX: zoomStates[activeIndex].panX,
                            startPanY: zoomStates[activeIndex].panY
                        };
                    } else {
                        finishZoomGesture();
                    }
                }

                return;
            }

            if (panState) {
                if (activePointers.size === 0) {
                    panState = null;
                    finishZoomGesture();
                }

                return;
            }

            if (activePointers.size === 0) {
                endDrag();
            }
        }

        track.addEventListener("pointerdown", onPointerDown);
        track.addEventListener("pointermove", onPointerMove);
        track.addEventListener("pointerup", onPointerUp);
        track.addEventListener("pointercancel", onPointerUp);
        track.addEventListener("pointerleave", onPointerUp);

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
